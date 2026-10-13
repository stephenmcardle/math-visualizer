import type { LatticePainter } from "@/templates/lattice/painter";
import type { XyParams } from "@/visualizations/xy-model/params";
import { countVortices, type XyFields } from "@/visualizations/xy-model/simulation";

/** Colors around the wheel; an angle in steps picks its color with `>> SHIFT`. */
const WHEEL_SIZE = 256;
const SHIFT = 8;

export const xyPainter: LatticePainter<XyParams, XyFields> = {
  // Angles are cyclic, so they take the palette's wheel.
  colors: (palette) => palette.wheel(WHEEL_SIZE),

  paint(state, pixels, table) {
    const { angles } = state;
    for (let site = 0; site < pixels.length; site++) pixels[site] = table[angles[site] >> SHIFT];
  },

  label(state, params) {
    const { vortices } = countVortices(state);
    return `T = ${params.temperature.toFixed(2)}\nvortices ${vortices}  sweep ${state.sweeps}`;
  },
};
