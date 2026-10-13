import type { LatticePainter } from "@/templates/lattice/painter";
import type { IsingParams } from "@/visualizations/ising-model/params";
import type { IsingFields } from "@/visualizations/ising-model/simulation";

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

export const isingPainter: LatticePainter<IsingParams, IsingFields> = {
  // Spin up and down take the palette's contrasting pair.
  colors: (palette) => palette.pair,

  paint(state, pixels, table) {
    const { spins } = state;
    const up = table[0];
    const down = table[1];
    for (let site = 0; site < pixels.length; site++) pixels[site] = spins[site] > 0 ? up : down;
  },

  label(state, params) {
    const m = state.magnetization / state.spins.length;
    return `T = ${params.temperature.toFixed(2)}\nm = ${formatSigned(m)}  sweep ${state.sweeps}`;
  },
};
