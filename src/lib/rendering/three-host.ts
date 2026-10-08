import { PerspectiveCamera, Scene, WebGLRenderer } from "three";

import type { EngineHost, RenderContext, ThreeRendererFactory } from "@/lib/rendering/types";

/**
 * Three.js counterpart to `createPixiHost`, for visualizations that genuinely
 * need 3D. No visualization uses it yet; it exists so the first 3D one only
 * has to write a renderer, not engine lifecycle code.
 */
export async function createThreeHost<TParams, TState>(
  container: HTMLElement,
  factory: ThreeRendererFactory<TParams, TState>,
  context: RenderContext,
): Promise<EngineHost<TParams, TState>> {
  const webgl = new WebGLRenderer({ antialias: true, alpha: true });
  webgl.setPixelRatio(context.quality.resolution);
  webgl.setSize(context.width, context.height);
  webgl.domElement.style.display = "block";
  container.appendChild(webgl.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, context.width / context.height, 0.1, 1000);
  const renderer = factory({ renderer: webgl, scene, camera }, context);

  return {
    renderer,
    resize(next) {
      camera.aspect = next.width / next.height;
      camera.updateProjectionMatrix();
      webgl.setPixelRatio(next.quality.resolution);
      webgl.setSize(next.width, next.height);
      renderer.resize(next);
    },
    present() {
      webgl.render(scene, camera);
    },
    destroy() {
      renderer.destroy();
      webgl.dispose();
      webgl.domElement.remove();
    },
  };
}
