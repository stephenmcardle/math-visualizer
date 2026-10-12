"use client";

import { useEffect, useId, useImperativeHandle, useRef, useState, type Ref } from "react";

import {
  detectAutoLevel,
  FrameTimeMonitor,
  lowerQuality,
  qualityProfile,
  type QualityLevel,
  type QualitySetting,
} from "@/lib/rendering/quality";
import type { EngineHost, RenderContext } from "@/lib/rendering/types";
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
}

const IDLE_LOOP: LoopControls = {
  restart() {},
  redraw() {},
  applyContext() {},
  capture: () => Promise.reject(new Error("The visualization hasn't started yet.")),
};

/**
 * The description only changes while paused: rewriting it every frame would
 * mean DOM work during animation and a moving target for screen readers.
 */
const PLAYING_DESCRIPTION = "Running. Pause to hear a description of the current state.";

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
    let autoLevel: QualityLevel | null = null;
    let wasPlaying = latest.current.playing;
    const clock = new StepClock();
    const monitor = new FrameTimeMonitor();

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
      autoLevel ??= detectAutoLevel({
        devicePixelRatio: window.devicePixelRatio,
        hardwareConcurrency: navigator.hardwareConcurrency,
        viewportWidth: window.innerWidth,
      });
      return autoLevel;
    };

    const renderContext = (): RenderContext => ({
      width: Math.max(1, container.clientWidth),
      height: Math.max(1, container.clientHeight),
      quality: qualityProfile(currentLevel(), window.devicePixelRatio),
    });

    let host: EngineHost<Params, unknown> | null = null;

    const applyContext = () => {
      const context = renderContext();
      host?.resize(context);
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
        if (quality === "auto" && monitor.sample(now)) {
          const lower = lowerQuality(currentLevel());
          if (lower) {
            autoLevel = lower;
            applyContext();
          }
        }
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
        setKeyboardHelp(created.renderer.keyboard?.help ?? null);
        schedule();
      })
      .catch((error: unknown) => {
        console.error(`Failed to start renderer for "${definition.metadata.slug}":`, error);
      });

    const onKeyDown = (event: KeyboardEvent) => {
      if (host?.renderer.keyboard?.onKeyDown(event)) event.preventDefault();
    };
    container.addEventListener("keydown", onKeyDown);

    const resizeObserver = new ResizeObserver(() => applyContext());
    resizeObserver.observe(container);

    // Restart timing after the tab was hidden so the loop doesn't try to catch up.
    const onVisibilityChange = () => {
      clock.reset();
      monitor.reset();
      if (!document.hidden) schedule();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      container.removeEventListener("keydown", onKeyDown);
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
        style={{ touchAction: "manipulation" }}
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
