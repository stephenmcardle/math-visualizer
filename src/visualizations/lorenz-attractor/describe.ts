import { DT, type LorenzState } from "@/visualizations/lorenz-attractor/simulation";

export function describeLorenz(state: LorenzState): string {
  const count = state.x.length;
  let positive = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < count; i++) {
    if (state.x[i] > 0) positive++;
    minX = Math.min(minX, state.x[i]);
    maxX = Math.max(maxX, state.x[i]);
  }
  const who = count === 1 ? "1 trajectory" : `${count} trajectories`;
  return (
    `${who} at time ${(state.step * DT).toFixed(1)}, rho = ${state.rho}. ` +
    `x ranges from ${minX.toFixed(1)} to ${maxX.toFixed(1)}; ` +
    `${positive} on the positive-x side and ${count - positive} on the negative-x side.`
  );
}
