import { Application } from "pixi.js";

import type { EngineHost, PixiRendererFactory, RenderContext } from "@/lib/rendering/types";

/**
 * Create one PixiJS application for the lifetime of a viewport. The
 * application does not run its own ticker; the viewport's loop decides when
 * to render so that paused visualizations cost nothing.
 */
export async function createPixiHost<TParams, TState>(
  container: HTMLElement,
  factory: PixiRendererFactory<TParams, TState>,
  context: RenderContext,
): Promise<EngineHost<TParams, TState>> {
  const app = new Application();
  await app.init({
    width: context.width,
    height: context.height,
    resolution: context.quality.resolution,
    autoDensity: true,
    antialias: true,
    backgroundAlpha: 0,
    autoStart: false,
  });
  app.canvas.style.display = "block";
  // Renderers don't use Pixi's pointer events, and its event system sets
  // `touch-action: none` on the canvas, which stops a swipe over the viewport
  // from scrolling the page. Detach it (Pixi passes null itself on destroy;
  // the type omits it) so the viewport's touch policy applies.
  app.renderer.events.setTargetElement(null as unknown as HTMLElement);
  container.appendChild(app.canvas);

  const renderer = factory(app, context);

  return {
    renderer,
    canvas: app.canvas,
    resize(next) {
      app.renderer.resize(next.width, next.height, next.quality.resolution);
      renderer.resize(next);
    },
    present() {
      app.render();
    },
    destroy() {
      renderer.destroy();
      app.destroy({ removeView: true }, { children: true, texture: true });
    },
  };
}
