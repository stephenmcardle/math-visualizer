import type { Application } from "pixi.js";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";

import type { QualityProfile } from "@/lib/rendering/quality";

export interface RenderContext {
  /** Viewport size in CSS pixels. */
  width: number;
  height: number;
  quality: QualityProfile;
}

/**
 * Turns simulation state into pixels. A renderer reads state; it never
 * advances or mutates it.
 */
export interface VisualizationRenderer<TParams, TState> {
  /** The simulation was (re)created from a seed; discard anything accumulated. */
  reset(state: TState, params: TParams): void;
  /** Draw the latest state. Called at most once per animation frame. */
  render(state: TState, params: TParams): void;
  /** Viewport size or quality changed. The engine canvas is already resized. */
  resize(context: RenderContext): void;
  destroy(): void;
}

export type PixiRendererFactory<TParams, TState> = (
  app: Application,
  context: RenderContext,
) => VisualizationRenderer<TParams, TState>;

export interface ThreeContext {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
}

export type ThreeRendererFactory<TParams, TState> = (
  three: ThreeContext,
  context: RenderContext,
) => VisualizationRenderer<TParams, TState>;

/**
 * Which engine a visualization uses, plus a lazy loader for its renderer so
 * the engine library is only downloaded on pages that need it.
 */
export type RendererBinding<TParams, TState> =
  | { engine: "pixi"; load: () => Promise<PixiRendererFactory<TParams, TState>> }
  | { engine: "three"; load: () => Promise<ThreeRendererFactory<TParams, TState>> };

/** What the viewport needs from an engine, independent of which engine it is. */
export interface EngineHost<TParams, TState> {
  renderer: VisualizationRenderer<TParams, TState>;
  resize(context: RenderContext): void;
  /** Flush the frame to the canvas after `renderer.render`. */
  present(): void;
  destroy(): void;
}
