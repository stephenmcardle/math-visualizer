import type { AshkinTellerParams } from "@/visualizations/ashkin-teller/params";
import type { AshkinTellerState } from "@/visualizations/ashkin-teller/simulation";

export function describeAshkinTeller(state: AshkinTellerState, params: AshkinTellerParams): string {
  const n = state.sigma.length;
  const percent = (sum: number) => Math.round((100 * (n + sum)) / 2 / n);
  return (
    `${state.side} by ${state.side} sites with four-spin coupling ${state.coupling.toFixed(2)}, ` +
    `at ${params.relativeTemperature.toFixed(2)} times the critical temperature, after ` +
    `${state.sweeps} sweeps. ${percent(state.sigmaSum)}% of σ spins and ` +
    `${percent(state.tauSum)}% of τ spins point up, and the two agree at ` +
    `${percent(state.productSum)}% of sites.`
  );
}
