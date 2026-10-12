"use client";

import { LocateFixedIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from "react";

import { attachPanZoomInput } from "@/components/visualization/pan-zoom-input";
import { Button } from "@/components/ui/button";
import {
  AutoQuality,
  detectAutoLevel,
  qualityProfile,
  type QualityLevel,
  type QualitySetting,
} from "@/lib/rendering/quality";
import type { EngineHost, RenderContext } from "@/lib/rendering/types";
import {
  DEFAULT_VIEW,
  clampView,
  isDefaultView,
  panView,
  zoomView,
  type View,
} from "@/lib/rendering/view";
import {
  LocalSimulationRunner,
  type SimulationRunner,
  type Snapshot,
} from "@/lib/simulation/runner";
import { StepClock } from "@/lib/simulation/step-clock";
import { WorkerSimulationRunner } from "@/lib/simulation/worker-runner";
import type { ParamValue } from "@/lib/url-state/params";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";

type Params = Record<string, ParamValue>;

export interface ViewportHandle {
  /** The current frame as a PNG, on the viewport's background color. */
  capture(): Promise<Blob>;
}

export interface VisualizationViewportProps {
  definition: AnyVisualizationDefinition;
  params: Params;
  seed: number;
  playing: boolean;
  quality: QualitySetting;
  /** Increment to restart the run with the current seed and params. */
  resetToken: number;
  /** Reports the level actually in use, which differs from the setting under "auto". */
  onQualityLevelChange?: (level: QualityLevel) => void;
  className?: string;
  ref?: Ref<ViewportHandle>;
}

interface LoopControls {
  /** Recreate the simulation from the current seed and params. */
  restart(): void;
  /** Draw a frame without restarting, and resume the loop if playing. */
  redraw(): void;
  /** Re-read viewport size and quality and resize the engine. */
  applyContext(): void;
  capture(): Promise<Blob>;
  /** Zoom about the viewport center; no-op without pan and zoom. */
  zoom(factor: number): void;
  resetView(): void;
}

const IDLE_LOOP: LoopControls = {
  restart() {},
  redraw() {},
  applyContext() {},
  zoom() {},
  resetView() {},
  capture: () => Promise.reject(new Error("The visualization hasn't started yet.")),
};

/**
 * The description only changes while paused: rewriting it every frame would
 * mean DOM work during animation and a moving target for screen readers.
 */
const PLAYING_DESCRIPTION = "Running. Pause to hear a description of the current state.";

const PAN_ZOOM_HELP =
  "Press plus or minus to zoom, the arrow keys to pan, and 0 to reset the view.";
/** Zoom per key press or button click. */
const ZOOM_STEP = 1.25;
/** Pan per arrow key press, in CSS pixels. */
const PAN_STEP = 40;

/** What the zoom buttons can do; null when the renderer has no pan and zoom. */
interface ViewButtons {
  canZoomIn: boolean;
  canZoomOut: boolean;
  canReset: boolean;
}

function sameButtons(a: ViewButtons | null, b: ViewButtons) {
  return a?.canZoomIn === b.canZoomIn && a.canZoomOut === b.canZoomOut && a.canReset === b.canReset;
}

/** Changes to these restart the simulation; `live` params apply in place. */
function simulationKey(definition: AnyVisualizationDefinition, params: Params, seed: number) {
  const restartParams = Object.keys(definition.params)
    .filter((key) => !definition.params[key].live)
    .map((key) => `${key}=${params[key]}`);
  return `${restartParams.join("&")}|${seed}`;
}

async function createEngineHost(
  definition: AnyVisualizationDefinition,
  container: HTMLElement,
  context: RenderContext,
  requestRender: () => void,
): Promise<EngineHost<Params, unknown>> {
  // Engines are imported on demand so a page only downloads the one it uses.
  const binding = definition.renderer;
  if (binding.engine === "pixi") {
    const [{ createPixiHost }, factory] = await Promise.all([
      import("@/lib/rendering/pixi-host"),
      binding.load(),
    ]);
    return createPixiHost(container, factory, context);
  }
  const [{ createThreeHost }, factory] = await Promise.all([
    import("@/lib/rendering/three-host"),
    binding.load(),
  ]);
  return createThreeHost(container, factory, context, requestRender);
}

/**
 * Hosts one visualization: creates the engine once per definition, then runs
 * a requestAnimationFrame loop that steps the simulation and renders.
 *
 * React only passes configuration in. Per-frame data stays in refs and the
 * loop, so animation never causes a React render.
 */
export function VisualizationViewport({
  definition,
  params,
  seed,
  playing,
  quality,
  resetToken,
  onQualityLevelChange,
  className,
  ref,
}: VisualizationViewportProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const announcementRef = useRef<HTMLParagraphElement>(null);
  const loopRef = useRef<LoopControls>(IDLE_LOOP);
  const [failedSlug, setFailedSlug] = useState<string | null>(null);
  const [keyboardHelp, setKeyboardHelp] = useState<string | null>(null);
  const [viewButtons, setViewButtons] = useState<ViewButtons | null>(null);
  const descriptionId = useId();
  const keyboardHelpId = useId();

  // Latest props, read by the loop without re-running effects.
  const latest = useRef({ params, seed, playing, quality, onQualityLevelChange });
  useEffect(() => {
    latest.current = { params, seed, playing, quality, onQualityLevelChange };
  });

  // Engine, runner and frame loop: created once per visualization.
  useImperativeHandle(ref, () => ({ capture: () => loopRef.current.capture() }), []);

  useEffect(() => {
    const container = containerRef.current;
    const root = rootRef.current;
    const description = descriptionRef.current;
    const announcement = announcementRef.current;
    if (!container || !root || !description || !announcement) return;

    let disposed = false;
    let frameId = 0;
    let renderedGeneration = -1;
    let needsReset = true;
    let auto: AutoQuality | null = null;
    let wasPlaying = latest.current.playing;
    const clock = new StepClock();

    const schedule = () => {
      if (!frameId && !disposed) frameId = requestAnimationFrame(frame);
    };

    const runner: SimulationRunner<Params, unknown> =
      definition.execution === "worker"
        ? new WorkerSimulationRunner(definition.metadata.slug, schedule, () =>
            setFailedSlug(definition.metadata.slug),
          )
        : new LocalSimulationRunner(definition.simulation);

    const currentLevel = (): QualityLevel => {
      const setting = latest.current.quality;
      if (setting !== "auto") return setting;
      auto ??= new AutoQuality(
        detectAutoLevel({
          devicePixelRatio: window.devicePixelRatio,
          hardwareConcurrency: navigator.hardwareConcurrency,
          viewportWidth: window.innerWidth,
        }),
      );
      return auto.level;
    };

    const renderContext = (): RenderContext => ({
      width: Math.max(1, container.clientWidth),
      height: Math.max(1, container.clientHeight),
      quality: qualityProfile(currentLevel(), window.devicePixelRatio),
    });

    let host: EngineHost<Params, unknown> | null = null;
    let view: View = DEFAULT_VIEW;
    let detachPanZoom = () => {};

    // View changes come from user input, never the frame loop, so updating the
    // buttons' React state here doesn't put React in the animation path.
    const setView = (next: View) => {
      const panZoom = host?.renderer.panZoom;
      if (!panZoom) return;
      view = clampView(next, renderContext(), panZoom);
      panZoom.setView(view);
      const buttons = {
        canZoomIn: view.scale < panZoom.maxScale,
        canZoomOut: view.scale > panZoom.minScale,
        canReset: !isDefaultView(view),
      };
      setViewButtons((previous) => (sameButtons(previous, buttons) ? previous : buttons));
      schedule();
    };

    const zoomAboutCenter = (factor: number) => {
      const panZoom = host?.renderer.panZoom;
      if (!panZoom) return;
      const size = renderContext();
      setView(zoomView(view, factor, size.width / 2, size.height / 2, size, panZoom));
    };

    /** Keys for pan and zoom; modified keys are left to the browser (Ctrl + plus zooms the page). */
    const onViewKey = (event: KeyboardEvent): boolean => {
      if (!host?.renderer.panZoom || event.ctrlKey || event.altKey || event.metaKey) return false;
      const pan = (dx: number, dy: number) =>
        setView({ ...view, panX: view.panX + dx, panY: view.panY + dy });
      switch (event.key) {
        case "+":
        case "=":
          zoomAboutCenter(ZOOM_STEP);
          return true;
        case "-":
        case "_":
          zoomAboutCenter(1 / ZOOM_STEP);
          return true;
        case "0":
          setView(DEFAULT_VIEW);
          return true;
        case "ArrowLeft":
          pan(PAN_STEP, 0);
          return true;
        case "ArrowRight":
          pan(-PAN_STEP, 0);
          return true;
        case "ArrowUp":
          pan(0, PAN_STEP);
          return true;
        case "ArrowDown":
          pan(0, -PAN_STEP);
          return true;
        default:
          return false;
      }
    };

    const applyContext = () => {
      const context = renderContext();
      host?.resize(context);
      // The same pan may now reach past the content's edge.
      setView(view);
      latest.current.onQualityLevelChange?.(context.quality.level);
      schedule();
    };

    const draw = (snapshot: Snapshot<unknown>, params: Params) => {
      if (!host) return;
      if (snapshot.generation !== renderedGeneration) {
        renderedGeneration = snapshot.generation;
        host.renderer.reset(snapshot.state, params);
      }
      host.renderer.render(snapshot.state, params);
      host.present();
    };

    const describe = (snapshot: Snapshot<unknown>, params: Params, playing: boolean) => {
      if (!definition.describe) return;
      const text = playing ? PLAYING_DESCRIPTION : definition.describe(snapshot.state, params);
      if (description.textContent !== text) description.textContent = text;
      if (wasPlaying && !playing) announcement.textContent = `Paused. ${text}`;
      wasPlaying = playing;
    };

    function frame(now: number) {
      frameId = 0;
      if (!host) return;
      const { params, seed, playing, quality } = latest.current;

      if (needsReset) {
        needsReset = false;
        runner.reset(params, seed);
        clock.reset();
      }

      if (playing) {
        runner.advance(params, clock.tick(now, definition.stepsPerSecond(params)));
        if (quality === "auto" && auto?.sample(now)) applyContext();
      }

      const snapshot = runner.current();
      if (snapshot) {
        draw(snapshot, params);
        describe(snapshot, params, playing);
      }

      if (playing) schedule();
    }

    loopRef.current = {
      restart() {
        needsReset = true;
        schedule();
      },
      redraw() {
        clock.reset();
        schedule();
      },
      applyContext,
      zoom: zoomAboutCenter,
      resetView: () => setView(DEFAULT_VIEW),
      capture() {
        const snapshot = runner.current();
        if (!host || !snapshot) {
          return Promise.reject(new Error("The visualization hasn't drawn a frame yet."));
        }
        // WebGL may clear its canvas once a frame is composited, so draw and
        // copy in the same task.
        draw(snapshot, latest.current.params);
        const source = host.canvas;
        const image = document.createElement("canvas");
        image.width = source.width;
        image.height = source.height;
        const context2d = image.getContext("2d");
        if (!context2d) return Promise.reject(new Error("2D canvas is not available."));
        // Engine canvases are transparent over the themed card; keep its color.
        context2d.fillStyle = getComputedStyle(root).backgroundColor;
        context2d.fillRect(0, 0, image.width, image.height);
        context2d.drawImage(source, 0, 0);
        return new Promise((resolve, reject) => {
          image.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Encoding the image failed."))),
            "image/png",
          );
        });
      },
    };

    const initialContext = renderContext();
    latest.current.onQualityLevelChange?.(initialContext.quality.level);
    createEngineHost(definition, container, initialContext, schedule)
      .then((created) => {
        if (disposed) {
          created.destroy();
          return;
        }
        host = created;
        const { keyboard, panZoom } = created.renderer;
        setKeyboardHelp(keyboard?.help ?? (panZoom ? PAN_ZOOM_HELP : null));
        if (panZoom) {
          detachPanZoom = attachPanZoomInput(container, {
            pan: (dx, dy) => setView(panView(view, dx, dy, renderContext(), panZoom)),
            zoom: (factor, x, y) => setView(zoomView(view, factor, x, y, renderContext(), panZoom)),
          });
          setView(view);
        }
        schedule();
      })
      .catch((error: unknown) => {
        console.error(`Failed to start renderer for "${definition.metadata.slug}":`, error);
      });

    const onKeyDown = (event: KeyboardEvent) => {
      if (host?.renderer.keyboard?.onKeyDown(event) || onViewKey(event)) event.preventDefault();
    };
    container.addEventListener("keydown", onKeyDown);

    const resizeObserver = new ResizeObserver(() => applyContext());
    resizeObserver.observe(container);

    // Restart timing after the tab was hidden so the loop doesn't try to catch up.
    const onVisibilityChange = () => {
      clock.reset();
      auto?.resetTiming();
      if (!document.hidden) schedule();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener("keydown", onKeyDown);
      detachPanZoom();
      setViewButtons(null);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      runner.dispose();
      host?.destroy();
      host = null;
      loopRef.current = IDLE_LOOP;
    };
  }, [definition]);

  // Seed, restart-params or explicit reset: start a new run.
  const key = simulationKey(definition, params, seed);
  useEffect(() => {
    loopRef.current.restart();
  }, [key, resetToken]);

  useEffect(() => {
    loopRef.current.applyContext();
  }, [quality]);

  // Play/pause and live params: draw a frame (even when paused, so changes are
  // visible) and resume the loop if playing.
  useEffect(() => {
    loopRef.current.redraw();
  }, [playing, params]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <div
        ref={containerRef}
        className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        // Pan and zoom take two-finger gestures, so the browser keeps only
        // one-finger scrolling there (ADR 0012).
        style={{ touchAction: viewButtons ? "pan-x pan-y" : "manipulation" }}
        role="img"
        aria-label={`${definition.metadata.title} visualization`}
        aria-describedby={keyboardHelp ? `${descriptionId} ${keyboardHelpId}` : descriptionId}
        tabIndex={keyboardHelp ? 0 : undefined}
      />
      <p ref={descriptionRef} id={descriptionId} className="sr-only" />
      {keyboardHelp && (
        <p id={keyboardHelpId} className="sr-only">
          {keyboardHelp}
        </p>
      )}
      <p ref={announcementRef} aria-live="polite" className="sr-only" />
      {viewButtons && (
        <div className="absolute right-2 bottom-2 flex gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            disabled={!viewButtons.canZoomOut}
            onClick={() => loopRef.current.zoom(1 / ZOOM_STEP)}
          >
            <ZoomOutIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            disabled={!viewButtons.canZoomIn}
            onClick={() => loopRef.current.zoom(ZOOM_STEP)}
          >
            <ZoomInIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Reset view"
            disabled={!viewButtons.canReset}
            onClick={() => loopRef.current.resetView()}
          >
            <LocateFixedIcon />
          </Button>
        </div>
      )}
      {failedSlug === definition.metadata.slug && (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-card/90 p-6 text-center text-sm text-muted-foreground"
        >
          The simulation stopped because of an error. Reload the page to try again.
        </div>
      )}
    </div>
  );
}
