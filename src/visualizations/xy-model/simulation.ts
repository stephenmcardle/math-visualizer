import { ANGLE_MASK, ANGLE_STEPS, COS, angleDifference } from "@/lib/math/angles";
import { expNegative } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { XyParams } from "@/visualizations/xy-model/params";

/**
 * The planar XY model: a unit vector at angle θ per site, with energy
 * −Σ cos(θ − θ′) over neighboring pairs. Angles are whole steps of 1/65536
 * turn (`src/lib/math/angles.ts`). Each Metropolis attempt proposes a
 * uniformly random new angle.
 */
export interface XyFields {
  /** Angle per site, in steps. */
  angles: Uint16Array;
  /** Live: read from the params before every sweep. */
  temperature: number;
}

export type XyState = LatticeState<XyFields>;

/** One bond's energy change when a spin turns from `current` to `proposal`. */
function bondChange(current: number, proposal: number, neighbor: number): number {
  return COS[(current - neighbor) & ANGLE_MASK] - COS[(proposal - neighbor) & ANGLE_MASK];
}

const xyModel: LatticeModel<XyParams, XyFields> = {
  init(side, params, rng) {
    const angles = new Uint16Array(side * side);
    if (params.start !== "up") {
      for (let i = 0; i < angles.length; i++) angles[i] = nextInt(rng, ANGLE_STEPS);
    }
    return { angles, temperature: params.temperature };
  },

  prepare(state, params) {
    state.temperature = params.temperature;
  },

  attempt(state, site, north, south, west, east) {
    const { angles, rng } = state;
    const current = angles[site];
    const proposal = nextInt(rng, ANGLE_STEPS);
    const delta =
      bondChange(current, proposal, angles[north]) +
      bondChange(current, proposal, angles[south]) +
      bondChange(current, proposal, angles[west]) +
      bondChange(current, proposal, angles[east]);
    if (delta <= 0 || nextFloat(rng) < expNegative(delta / state.temperature)) {
      angles[site] = proposal;
    }
  },
};

export const xySimulation = latticeSimulation(xyModel);

/**
 * Vortices and antivortices: plaquettes around which the angle turns once
 * forward or once back. Exact, because the steps around a plaquette add up to a
 * whole number of turns. On the torus the two counts match, except in the rare
 * case (1 in 65536 per bond) of neighbors exactly half a turn apart, which count
 * as turning back from either side; that only affects the displayed count.
 */
export function countVortices(state: XyState): { vortices: number; antivortices: number } {
  const { side, angles } = state;
  let vortices = 0;
  let antivortices = 0;
  for (let row = 0; row < side; row++) {
    const below = row === side - 1 ? 0 : row + 1;
    for (let col = 0; col < side; col++) {
      const right = col === side - 1 ? 0 : col + 1;
      const a = angles[row * side + col];
      const b = angles[row * side + right];
      const c = angles[below * side + right];
      const d = angles[below * side + col];
      const turn =
        angleDifference(a, b) +
        angleDifference(b, c) +
        angleDifference(c, d) +
        angleDifference(d, a);
      if (turn > 0) vortices++;
      else if (turn < 0) antivortices++;
    }
  }
  return { vortices, antivortices };
}
