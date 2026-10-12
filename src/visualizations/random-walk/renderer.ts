import { Container, Graphics, RenderTexture, Sprite } from "pixi.js";

import { palette } from "@/lib/rendering/palettes";
import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import { DEFAULT_VIEW, viewTransform, type ViewTransform } from "@/lib/rendering/view";
import type { RandomWalkParams } from "@/visualizations/random-walk/params";
import type { RandomWalkState } from "@/visualizations/random-walk/simulation";

const TRAIL_ALPHA = 0.55;
const HEAD_RADIUS = 2;
/** Walkers spread out over time, so zooming out matters as much as zooming in. */
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
/** How long the view must be still before trails are redrawn at the new zoom. */
const SETTLE_MS = 200;

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
 *
 * The texture holds screen pixels for the view it was drawn with. While the
 * view moves, the sprite is transformed to follow; once it settles, the
 * texture is redrawn ("rebaked") for the new view so new segments are crisp
 * again. Old trails keep the resolution they were drawn at, and walks that
 * happened off-screen were never drawn, so zooming out shows none for them.
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
  let paletteValue = "";
  let trailsShown = true;
  let prevX = new Float64Array(0);
  let prevY = new Float64Array(0);
  let view = DEFAULT_VIEW;
  let viewChangedAt = 0;
  /** The transform the trail texture was drawn with. */
  let baked: ViewTransform = viewTransform(view, context);

  const placeTrails = () => {
    const current = viewTransform(view, context);
    const k = current.scale / baked.scale;
    trailSprite.scale.set(k);
    trailSprite.position.set(current.x - baked.x * k, current.y - baked.y * k);
  };

  const rebake = () => {
    const next = createTrailTexture(context);
    const copy = new Sprite(trails);
    copy.position.copyFrom(trailSprite.position);
    copy.scale.copyFrom(trailSprite.scale);
    // A wrapper, so the copy's own transform applies when rendered as the root.
    const wrapper = new Container();
    wrapper.addChild(copy);
    app.renderer.render({
      container: wrapper,
      target: next,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
    wrapper.destroy({ children: true });
    trails.destroy(true);
    trails = next;
    trailSprite.texture = trails;
    baked = viewTransform(view, context);
    placeTrails();
  };

  const clearTrails = () => {
    app.renderer.render({
      container: empty,
      target: trails,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
  };

  return {
    reset(state, params) {
      paletteValue = params.palette;
      colors = palette(paletteValue).colors(state.x.length);
      prevX = state.x.slice();
      prevY = state.y.slice();
      clearTrails();
    },

    render(state, params) {
      const { x, y } = state;
      const ox = context.width / 2;
      const oy = context.height / 2;
      const current = viewTransform(view, context);
      // Drawn trails can't be recolored, so a new palette starts them afresh;
      // the walkers carry on.
      if (params.palette !== paletteValue) {
        paletteValue = params.palette;
        colors = palette(paletteValue).colors(x.length);
        clearTrails();
      }
      if (
        (baked.scale !== current.scale || baked.x !== current.x || baked.y !== current.y) &&
        performance.now() - viewChangedAt > SETTLE_MS
      ) {
        rebake();
      }

      if (params.trails) {
        segments.clear();
        const { scale: s, x: bx, y: by } = baked;
        for (let i = 0; i < x.length; i++) {
          if (x[i] === prevX[i] && y[i] === prevY[i]) continue;
          segments
            .moveTo(bx + s * (ox + prevX[i]), by + s * (oy + prevY[i]))
            .lineTo(bx + s * (ox + x[i]), by + s * (oy + y[i]))
            .stroke({ width: 1, color: colors[i], alpha: TRAIL_ALPHA });
        }
        app.renderer.render({ container: segments, target: trails, clear: false });
      } else if (trailsShown) {
        clearTrails();
      }
      trailsShown = params.trails;
      // Track positions even with trails off, so turning them back on starts
      // from where the walkers are instead of drawing a jump.
      prevX.set(x);
      prevY.set(y);

      heads.clear();
      // Without trails the heads are all there is, so draw them at any quality.
      if (!params.trails || context.quality.level !== "low") {
        const { scale: s, x: cx, y: cy } = current;
        for (let i = 0; i < x.length; i++) {
          heads.circle(cx + s * (ox + x[i]), cy + s * (oy + y[i]), HEAD_RADIUS).fill(colors[i]);
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
      baked = viewTransform(view, next);
      placeTrails();
    },

    panZoom: {
      minScale: MIN_ZOOM,
      maxScale: MAX_ZOOM,
      setView(next) {
        view = next;
        viewChangedAt = performance.now();
        placeTrails();
      },
    },

    destroy() {
      segments.destroy();
      empty.destroy();
      trails.destroy(true);
    },
  };
};
