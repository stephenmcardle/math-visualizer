import type { PottsParams } from "@/visualizations/potts-model/params";
import type { PottsState } from "@/visualizations/potts-model/simulation";

/** Share of sites in the most common state, from 1/q (disordered) to 1 (ordered). */
export function majorityShare(state: PottsState): number {
  return Math.max(...state.counts) / state.states.length;
}

export function describePotts(state: PottsState, params: PottsParams): string {
  return (
    `${state.side} by ${state.side} sites with ${state.q} states at ` +
    `${params.relativeTemperature.toFixed(2)} times the critical temperature, ` +
    `after ${state.sweeps} sweeps. The most common state covers ` +
    `${Math.round(100 * majorityShare(state))}% of sites.`
  );
}
