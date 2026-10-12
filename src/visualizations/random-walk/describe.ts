import type { RandomWalkParams } from "@/visualizations/random-walk/params";
import type { RandomWalkState } from "@/visualizations/random-walk/simulation";

export function describeRandomWalk(state: RandomWalkState, params: RandomWalkParams): string {
  const walkers = state.x.length;
  let sumSquares = 0;
  for (let i = 0; i < walkers; i++) sumSquares += state.x[i] ** 2 + state.y[i] ** 2;
  const rms = Math.sqrt(sumSquares / walkers);
  const predicted = params.stepSize * Math.sqrt(state.step);
  const who = walkers === 1 ? "1 walker" : `${walkers} walkers`;
  return (
    `${who} after ${state.step} steps. ` +
    `Root-mean-square distance from the start: ${rms.toFixed(1)} pixels; ` +
    `step size times the square root of the step count gives ${predicted.toFixed(1)}.`
  );
}
