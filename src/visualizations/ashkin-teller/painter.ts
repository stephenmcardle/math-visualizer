import { distinctColors, type LatticePainter } from "@/templates/lattice/painter";
import type { AshkinTellerParams } from "@/visualizations/ashkin-teller/params";
import type { AshkinTellerFields } from "@/visualizations/ashkin-teller/simulation";

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

export const ashkinTellerPainter: LatticePainter<AshkinTellerParams, AshkinTellerFields> = {
  // One color per (σ, τ) pair: (+, +), (−, +), (+, −), (−, −).
  colors: (palette) => distinctColors(palette, 4),

  paint(state, pixels, table) {
    const { sigma, tau } = state;
    for (let site = 0; site < pixels.length; site++) {
      pixels[site] = table[(sigma[site] < 0 ? 1 : 0) + (tau[site] < 0 ? 2 : 0)];
    }
  },

  label(state, params) {
    const n = state.sigma.length;
    return (
      `T = ${params.relativeTemperature.toFixed(2)} Tc  K = ${state.coupling.toFixed(2)}\n` +
      `σ ${formatSigned(state.sigmaSum / n)}  τ ${formatSigned(state.tauSum / n)}  ` +
      `στ ${formatSigned(state.productSum / n)}  sweep ${state.sweeps}`
    );
  },
};
