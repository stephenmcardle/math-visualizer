import { expNegative } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { PottsParams } from "@/visualizations/potts-model/params";

/**
 * The q-state Potts model (J = 1, energy −1 per pair of equal neighbors) on
 * the lattice template's torus, sampled with the Metropolis algorithm.
 */
export interface PottsFields {
  q: number;
  /** 0 to q − 1 per site, row-major. */
  states: Uint8Array;
  /** Sites in each state, kept up to date on every change. */
  counts: Int32Array;
  /** The relative temperature the acceptance probabilities below were computed for. */
  relativeTemperature: number;
  /** Index k: probability of accepting a change that raises the energy by k (1 to 4). */
  accept: Float64Array;
}

export type PottsState = LatticeState<PottsFields>;

/**
 * ln(1 + √q), the critical inverse temperature for q = 2 to 10 (Beffara and
 * Duminil-Copin, 2012). Stored as numbers because `Math.log` may round
 * differently between browsers (ISS-005); a test checks them against it.
 */
export const CRITICAL_BETA: readonly number[] = [
  NaN,
  NaN,
  0.8813735870195429,
  1.005052538742381,
  1.0986122886681098,
  1.1743590056195488,
  1.2382263194623326,
  1.2935624652259803,
  1.342454046453526,
  1.3862943611198906,
  1.4260624389053682,
];

function setTemperature(fields: PottsFields, relativeTemperature: number): void {
  fields.relativeTemperature = relativeTemperature;
  // T = relativeTemperature · T_c and T_c = 1 / β_c, so ΔE / T = k · β_c / relativeTemperature.
  const beta = CRITICAL_BETA[fields.q] / relativeTemperature;
  for (let k = 1; k <= 4; k++) fields.accept[k] = expNegative(k * beta);
}

/** One neighbor's share of ΔE: an equal pair is lost (+1) or gained (−1). */
function energyChange(neighbor: number, current: number, proposal: number): number {
  return neighbor === current ? 1 : neighbor === proposal ? -1 : 0;
}

const pottsModel: LatticeModel<PottsParams, PottsFields> = {
  init(side, params, rng) {
    const { q } = params;
    const n = side * side;
    const states = new Uint8Array(n);
    const counts = new Int32Array(q);
    for (let i = 0; i < n; i++) {
      states[i] = params.start === "up" ? 0 : nextInt(rng, q);
      counts[states[i]]++;
    }
    const fields = { q, states, counts, relativeTemperature: 0, accept: new Float64Array(5) };
    setTemperature(fields, params.relativeTemperature);
    return fields;
  },

  prepare(state, params) {
    // Temperature is live: a change applies from the next sweep on.
    if (params.relativeTemperature !== state.relativeTemperature) {
      setTemperature(state, params.relativeTemperature);
    }
  },

  attempt(state, site, north, south, west, east) {
    const { states, rng } = state;
    const current = states[site];
    // Propose one of the other q − 1 states, uniformly.
    let proposal = nextInt(rng, state.q - 1);
    if (proposal >= current) proposal++;
    const delta =
      energyChange(states[north], current, proposal) +
      energyChange(states[south], current, proposal) +
      energyChange(states[west], current, proposal) +
      energyChange(states[east], current, proposal);
    if (delta <= 0 || nextFloat(rng) < state.accept[delta]) {
      states[site] = proposal;
      state.counts[current]--;
      state.counts[proposal]++;
    }
  },
};

export const pottsSimulation = latticeSimulation(pottsModel);
