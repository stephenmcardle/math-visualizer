"use client";

import { useEffect, useRef, useState } from "react";

import {
  detectAutoLevel,
  FrameTimeMonitor,
  lowerQuality,
  qualityProfile,
  type QualityLevel,
  type QualitySetting,
} from "@/lib/rendering/quality";
import type { EngineHost, RenderContext } from "@/lib/rendering/types";
import { LocalSimulationRunner, type SimulationRunner } from "@/lib/simulation/runner";
import { StepClock } from "@/lib/simulation/step-clock";
import { WorkerSimulationRunner } from "@/lib/simulation/worker-runner";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";

type Params = Record<string, number>;

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
}

interface LoopControls {
  /** Recreate the simulation from the current seed and params. */
  restart(): void;
  /** Draw a frame without restarting, and resume the loop if playing. */
  redraw(): void;
  /** Re-read viewport size and quality and resize the engine. */
  applyContext(): void;
}

const IDLE_LOOP: LoopControls = { restart() {}, redraw() {}, applyContext() {} };

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
  return createThreeHost(container, factory, context);
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
}: VisualizationViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<LoopControls>(IDLE_LOOP);
  const [failedSlug, setFailedSlug] = useState<string | null>(null);

  // Latest props, read by the loop without re-running effects.
  const latest = useRef({ params, seed, playing, quality, onQualityLevelChange });
  useEffect(() => {
    latest.current = { params, seed, playing, quality, onQualityLevelChange };
  });

  // Engine, runner and frame loop: created once per visualization.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;
    let renderedGeneration = -1;
    let needsReset = true;
    let autoLevel: QualityLevel | null = null;
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
        if (snapshot.generation !== renderedGeneration) {
          renderedGeneration = snapshot.generation;
          host.renderer.reset(snapshot.state, params);
        }
        host.renderer.render(snapshot.state, params);
        host.present();
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
    };

    const initialContext = renderContext();
    latest.current.onQualityLevelChange?.(initialContext.quality.level);
    createEngineHost(definition, container, initialContext)
      .then((created) => {
        if (disposed) {
          created.destroy();
          return;
        }
        host = created;
        schedule();
      })
      .catch((error: unknown) => {
        console.error(`Failed to start renderer for "${definition.metadata.slug}":`, error);
      });

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
    <div className={`relative ${className ?? ""}`}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ touchAction: "manipulation" }}
        role="img"
        aria-label={`${definition.metadata.title} visualization`}
      />
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
