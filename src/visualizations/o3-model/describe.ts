import type { O3Params } from "@/visualizations/o3-model/params";
import { magnetization, type O3State } from "@/visualizations/o3-model/simulation";

export function describeO3(state: O3State, params: O3Params): string {
  return (
    `${state.side} by ${state.side} spins at temperature ${params.temperature.toFixed(2)}, ` +
    `after ${state.sweeps} sweeps. The average spin has length ${magnetization(state).toFixed(3)}.`
  );
}
