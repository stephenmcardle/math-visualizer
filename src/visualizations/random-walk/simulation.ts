import { createRng, nextFloat, nextInt, type Rng } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";
import type { RandomWalkParams } from "@/visualizations/random-walk/params";

/**
 * 2D random walk with fixed step length. With `directions: "any"` it is
 * Pearson's isotropic walk (direction uniform in [0, 2π)); with `"grid"` it is
 * the simple random walk on the square lattice (one of four axis directions).
 * Both draw exactly one random number per walker per step.
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
    const s = params.stepSize;
    if (params.directions === "grid") {
      for (let i = 0; i < x.length; i++) {
        const direction = nextInt(rng, 4);
        if (direction === 0) x[i] += s;
        else if (direction === 1) x[i] -= s;
        else if (direction === 2) y[i] += s;
        else y[i] -= s;
      }
    } else {
      for (let i = 0; i < x.length; i++) {
        const angle = TAU * nextFloat(rng);
        x[i] += s * Math.cos(angle);
        y[i] += s * Math.sin(angle);
      }
    }
    state.step++;
  },
};
