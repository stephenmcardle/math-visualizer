import type { RandomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import type { RandomBondIsingState } from "@/visualizations/random-bond-ising/simulation";

export function describeRandomBondIsing(
  state: RandomBondIsingState,
  params: RandomBondIsingParams,
): string {
  const spins = state.spins.length;
  const upPercent = Math.round((100 * (spins + state.magnetization)) / 2 / spins);
  return (
    `${state.side} by ${state.side} spins with bond disorder ${state.disorder.toFixed(2)}, at ` +
    `${params.relativeTemperature.toFixed(2)} times the critical temperature, after ` +
    `${state.sweeps} sweeps. ${upPercent}% of spins point up.`
  );
}
