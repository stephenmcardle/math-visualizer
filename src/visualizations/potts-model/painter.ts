import { distinctColors, type LatticePainter } from "@/templates/lattice/painter";
import { majorityShare } from "@/visualizations/potts-model/describe";
import type { PottsParams } from "@/visualizations/potts-model/params";
import type { PottsFields } from "@/visualizations/potts-model/simulation";

export const pottsPainter: LatticePainter<PottsParams, PottsFields> = {
  colors: (palette, state) => distinctColors(palette, state.q),

  paint(state, pixels, table) {
    const { states } = state;
    for (let site = 0; site < pixels.length; site++) pixels[site] = table[states[site]];
  },

  label(state, params) {
    const share = Math.round(100 * majorityShare(state));
    return (
      `T = ${params.relativeTemperature.toFixed(2)} Tc  q = ${state.q}\n` +
      `largest ${share}%  sweep ${state.sweeps}`
    );
  },
};
