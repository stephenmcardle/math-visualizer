import type { IsingParams } from "@/visualizations/ising-model/params";
import type { IsingState } from "@/visualizations/ising-model/simulation";

export function describeIsing(state: IsingState, params: IsingParams): string {
  const spins = state.spins.length;
  const m = state.magnetization / spins;
  const upPercent = Math.round((100 * (spins + state.magnetization)) / 2 / spins);
  return (
    `${state.side} by ${state.side} spins at temperature ${params.temperature.toFixed(2)}, ` +
    `after ${state.sweeps} sweeps. Magnetization per spin ${m.toFixed(3)}: ` +
    `${upPercent}% of spins point up.`
  );
}
