import { expNegative } from "@/lib/math/deterministic";
import { nextFloat } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { IsingParams } from "@/visualizations/ising-model/params";

/**
 * The 2D Ising model (J = 1, no external field) on the lattice template's
 * torus, sampled with the Metropolis algorithm.
 */
export interface IsingFields {
  /** +1 or -1 per site, row-major. */
  spins: Int8Array;
  /** Sum of all spins, kept up to date on every flip. */
  magnetization: number;
  /** The temperature the acceptance probabilities below were computed for. */
  temperature: number;
  /** Probability of accepting a flip that raises the energy by 4, and by 8. */
  acceptFour: number;
  acceptEight: number;
}

export type IsingState = LatticeState<IsingFields>;

function setTemperature(fields: IsingFields, temperature: number): void {
  fields.temperature = temperature;
  fields.acceptFour = expNegative(4 / temperature);
  fields.acceptEight = expNegative(8 / temperature);
}

const isingModel: LatticeModel<IsingParams, IsingFields> = {
  init(side, params, rng) {
    const n = side * side;
    const spins = new Int8Array(n);
    let magnetization = 0;
    for (let i = 0; i < n; i++) {
      spins[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      magnetization += spins[i];
    }
    const fields = { spins, magnetization, temperature: 0, acceptFour: 0, acceptEight: 0 };
    setTemperature(fields, params.temperature);
    return fields;
  },

  prepare(state, params) {
    // Temperature is live: a change applies from the next sweep on.
    if (params.temperature !== state.temperature) setTemperature(state, params.temperature);
  },

  attempt(state, site, north, south, west, east) {
    const { spins } = state;
    // Flipping s changes the energy by 2·s·(sum of its four neighbors): -8, -4, 0, 4 or 8.
    const delta = 2 * spins[site] * (spins[north] + spins[south] + spins[west] + spins[east]);
    if (delta <= 0 || nextFloat(state.rng) < (delta === 4 ? state.acceptFour : state.acceptEight)) {
      spins[site] = -spins[site];
      state.magnetization += 2 * spins[site];
    }
  },
};

export const isingSimulation = latticeSimulation(isingModel);
