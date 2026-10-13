import { lerpHex } from "@/lib/rendering/palettes";
import type { LatticePainter } from "@/templates/lattice/painter";
import type { O3Params } from "@/visualizations/o3-model/params";
import { magnetization, type O3Fields } from "@/visualizations/o3-model/simulation";

/** Shades from down to up; a height in steps picks its shade with `>> SHIFT`. */
const SHADES = 64;
const SHIFT = 10;
/** Spins lying flat, between the two poles, are drawn gray on both themes. */
const MIDDLE = 0x808080;

export const o3Painter: LatticePainter<O3Params, O3Fields> = {
  // Color shows how far a spin points up (the palette's first color) or down (its second).
  colors(palette) {
    const [up, down] = palette.pair;
    return Array.from({ length: SHADES }, (_, i) => {
      const t = (i + 0.5) / SHADES;
      return t < 0.5 ? lerpHex(down, MIDDLE, 2 * t) : lerpHex(MIDDLE, up, 2 * t - 1);
    });
  },

  paint(state, pixels, table) {
    const { heights } = state;
    for (let site = 0; site < pixels.length; site++) pixels[site] = table[heights[site] >> SHIFT];
  },

  label(state, params) {
    return (
      `T = ${params.temperature.toFixed(2)}\n` +
      `|m| = ${magnetization(state).toFixed(3)}  sweep ${state.sweeps}`
    );
  },
};
