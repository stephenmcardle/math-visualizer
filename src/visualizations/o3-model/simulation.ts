import { ANGLE_STEPS, angleTables } from "@/lib/math/angles";
import { expNegative } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { O3Params } from "@/visualizations/o3-model/params";

/**
 * The O(3) model (classical Heisenberg model) in two dimensions: a unit vector
 * in space per site, with energy −Σ s·s′ over neighboring pairs. A direction is
 * stored as two 16-bit steps: height z, in 65536 equal bands from −1 to 1, and
 * longitude φ, in 1/65536 turns. Equal bands of height have equal area on the
 * sphere (Archimedes), so a uniform pair of steps is a uniform direction. Each
 * Metropolis attempt proposes a uniformly random new direction.
 */
export interface O3Fields {
  heights: Uint16Array;
  longitudes: Uint16Array;
  /** Live: read from the params before every sweep. */
  temperature: number;
}

export type O3State = LatticeState<O3Fields>;

export interface SphereTables {
  /** z at the middle of each height band, and the radius √(1 − z²) of its circle. */
  height: Float64Array;
  radius: Float64Array;
  /** cos and sin of each longitude step. */
  cos: Float64Array;
  sin: Float64Array;
}

let tables: SphereTables | null = null;

/** Built on first use, like `angleTables`, so other pages don't pay for them. */
export function sphereTables(): SphereTables {
  if (!tables) {
    const height = new Float64Array(ANGLE_STEPS);
    const radius = new Float64Array(ANGLE_STEPS);
    for (let k = 0; k < ANGLE_STEPS; k++) {
      height[k] = (2 * k + 1) / ANGLE_STEPS - 1;
      // Math.sqrt is correctly rounded everywhere, unlike Math.sin or Math.exp.
      radius[k] = Math.sqrt(1 - height[k] * height[k]);
    }
    tables = { height, radius, ...angleTables() };
  }
  return tables;
}

const o3Model: LatticeModel<O3Params, O3Fields> = {
  init(side, params, rng) {
    const n = side * side;
    const heights = new Uint16Array(n);
    const longitudes = new Uint16Array(n);
    if (params.start === "up") {
      heights.fill(ANGLE_STEPS - 1);
    } else {
      for (let i = 0; i < n; i++) {
        heights[i] = nextInt(rng, ANGLE_STEPS);
        longitudes[i] = nextInt(rng, ANGLE_STEPS);
      }
    }
    return { heights, longitudes, temperature: params.temperature };
  },

  prepare(state, params) {
    state.temperature = params.temperature;
  },

  attempt(state, site, north, south, west, east) {
    const { heights, longitudes, rng } = state;
    const { height: HEIGHT, radius: RADIUS, cos: COS, sin: SIN } = sphereTables();
    // The neighbors' sum, h; the energy change is −(s′ − s)·h.
    let hx = 0;
    let hy = 0;
    let hz = 0;
    for (let k = 0; k < 4; k++) {
      const j = k === 0 ? north : k === 1 ? south : k === 2 ? west : east;
      const r = RADIUS[heights[j]];
      hx += r * COS[longitudes[j]];
      hy += r * SIN[longitudes[j]];
      hz += HEIGHT[heights[j]];
    }
    const height = nextInt(rng, ANGLE_STEPS);
    const longitude = nextInt(rng, ANGLE_STEPS);
    const r0 = RADIUS[heights[site]];
    const r1 = RADIUS[height];
    const delta =
      (r0 * COS[longitudes[site]] - r1 * COS[longitude]) * hx +
      (r0 * SIN[longitudes[site]] - r1 * SIN[longitude]) * hy +
      (HEIGHT[heights[site]] - HEIGHT[height]) * hz;
    if (delta <= 0 || nextFloat(rng) < expNegative(delta / state.temperature)) {
      heights[site] = height;
      longitudes[site] = longitude;
    }
  },
};

export const o3Simulation = latticeSimulation(o3Model);

/** Length of the average spin, from 0 (no net direction) to 1 (all aligned). */
export function magnetization(state: O3State): number {
  const { heights, longitudes } = state;
  const { height: HEIGHT, radius: RADIUS, cos: COS, sin: SIN } = sphereTables();
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < heights.length; i++) {
    const r = RADIUS[heights[i]];
    x += r * COS[longitudes[i]];
    y += r * SIN[longitudes[i]];
    z += HEIGHT[heights[i]];
  }
  return Math.sqrt(x * x + y * y + z * z) / heights.length;
}
