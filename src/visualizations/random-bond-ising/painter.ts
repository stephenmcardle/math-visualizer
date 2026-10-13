import type { LatticePainter } from "@/templates/lattice/painter";
import type { RandomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import type { RandomBondIsingFields } from "@/visualizations/random-bond-ising/simulation";

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

export const randomBondIsingPainter: LatticePainter<RandomBondIsingParams, RandomBondIsingFields> =
  {
    // Spin up and down take the palette's contrasting pair, as in the Ising model.
    colors: (palette) => palette.pair,

    paint(state, pixels, table) {
      const { spins } = state;
      const up = table[0];
      const down = table[1];
      for (let site = 0; site < pixels.length; site++) pixels[site] = spins[site] > 0 ? up : down;
    },

    label(state, params) {
      const m = state.magnetization / state.spins.length;
      return (
        `T = ${params.relativeTemperature.toFixed(2)} Tc  ε = ${state.disorder.toFixed(2)}\n` +
        `m = ${formatSigned(m)}  sweep ${state.sweeps}`
      );
    },
  };
