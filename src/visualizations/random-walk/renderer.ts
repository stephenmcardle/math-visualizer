import { Color, Container, Graphics, RenderTexture, Sprite } from "pixi.js";

import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import type { RandomWalkParams } from "@/visualizations/random-walk/params";
import type { RandomWalkState } from "@/visualizations/random-walk/simulation";

const TRAIL_ALPHA = 0.55;
const HEAD_RADIUS = 2;
const GOLDEN_ANGLE_DEGREES = 137.508;

function walkerColors(count: number): number[] {
  // Golden-angle hue spacing keeps neighboring walkers distinguishable; mid
  // lightness reads on both light and dark backgrounds.
  return Array.from({ length: count }, (_, i) =>
    new Color({ h: (i * GOLDEN_ANGLE_DEGREES) % 360, s: 70, l: 52 }).toNumber(),
  );
}

function createTrailTexture(context: RenderContext): RenderTexture {
  return RenderTexture.create({
    width: context.width,
    height: context.height,
    resolution: context.quality.resolution,
  });
}

/**
 * Trails accumulate in an offscreen texture: each frame only the segments
 * walked since the previous frame are drawn into it, so cost stays
 * proportional to the number of walkers rather than the length of the run.
 * When several steps happen between frames, the segment joins the sampled
 * positions. The trail texture is visual memory owned by the renderer, not
 * part of the simulation state.
 */
export const createRandomWalkRenderer: PixiRendererFactory<RandomWalkParams, RandomWalkState> = (
  app,
  initialContext,
) => {
  let context = initialContext;
  let trails = createTrailTexture(context);
  const trailSprite = new Sprite(trails);
  const segments = new Graphics();
  const heads = new Graphics();
  const empty = new Container();
  app.stage.addChild(trailSprite, heads);

  let colors: number[] = [];
  let prevX = new Float64Array(0);
  let prevY = new Float64Array(0);

  const clearTrails = () => {
    app.renderer.render({
      container: empty,
      target: trails,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
  };

  return {
    reset(state) {
      colors = walkerColors(state.x.length);
      prevX = state.x.slice();
      prevY = state.y.slice();
      clearTrails();
    },

    render(state) {
      const { x, y } = state;
      const ox = context.width / 2;
      const oy = context.height / 2;

      segments.clear();
      for (let i = 0; i < x.length; i++) {
        if (x[i] === prevX[i] && y[i] === prevY[i]) continue;
        segments
          .moveTo(ox + prevX[i], oy + prevY[i])
          .lineTo(ox + x[i], oy + y[i])
          .stroke({ width: 1, color: colors[i], alpha: TRAIL_ALPHA });
      }
      app.renderer.render({ container: segments, target: trails, clear: false });
      prevX.set(x);
      prevY.set(y);

      heads.clear();
      if (context.quality.level !== "low") {
        for (let i = 0; i < x.length; i++) {
          heads.circle(ox + x[i], oy + y[i], HEAD_RADIUS).fill(colors[i]);
        }
      }
    },

    resize(next) {
      // The origin moves with the viewport center, so old trails would no
      // longer line up; start a fresh trail texture at the new size.
      context = next;
      const previous = trails;
      trails = createTrailTexture(next);
      trailSprite.texture = trails;
      previous.destroy(true);
    },

    destroy() {
      segments.destroy();
      empty.destroy();
      trails.destroy(true);
    },
  };
};
