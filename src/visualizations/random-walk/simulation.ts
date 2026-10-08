import { createRng, nextFloat, type Rng } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";
import type { RandomWalkParams } from "@/visualizations/random-walk/params";

/**
 * Isotropic 2D random walk (Pearson's random walk): every step has fixed
 * length and a direction drawn uniformly from [0, 2π).
 */
export interface RandomWalkState {
  /** Steps taken since creation. */
  step: number;
  rng: Rng;
  /** Walker positions in world units (CSS pixels at the default zoom), origin at the start point. */
  x: Float64Array;
  y: Float64Array;
}

const TAU = Math.PI * 2;

export const randomWalkSimulation: Simulation<RandomWalkParams, RandomWalkState> = {
  create(params, seed) {
    return {
      step: 0,
      rng: createRng(seed),
      x: new Float64Array(params.walkers),
      y: new Float64Array(params.walkers),
    };
  },

  step(state, params) {
    const { x, y, rng } = state;
    for (let i = 0; i < x.length; i++) {
      const angle = TAU * nextFloat(rng);
      x[i] += params.stepSize * Math.cos(angle);
      y[i] += params.stepSize * Math.sin(angle);
    }
    state.step++;
  },
};
