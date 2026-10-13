import type { XyParams } from "@/visualizations/xy-model/params";
import { countVortices, type XyState } from "@/visualizations/xy-model/simulation";

export function describeXy(state: XyState, params: XyParams): string {
  const { vortices, antivortices } = countVortices(state);
  return (
    `${state.side} by ${state.side} spins at temperature ${params.temperature.toFixed(2)}, ` +
    `after ${state.sweeps} sweeps: ${vortices} vortices and ${antivortices} antivortices.`
  );
}
