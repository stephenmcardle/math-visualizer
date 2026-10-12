import { createRng, nextFloat, nextInt, type Rng } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";
import type { IsingParams } from "@/visualizations/ising-model/params";

/**
 * The 2D Ising model (J = 1, no external field) on a `side` × `side` torus,
 * sampled with the Metropolis algorithm. One step is one sweep: `side²`
 * attempts, each at a uniformly random site.
 */
export interface IsingState {
  side: number;
  rng: Rng;
  /** +1 or -1 per site, row-major. */
  spins: Int8Array;
  sweeps: number;
  /** Sum of all spins, kept up to date on every flip. */
  magnetization: number;
  /** The temperature the acceptance probabilities below were computed for. */
  temperature: number;
  /** Probability of accepting a flip that raises the energy by 4, and by 8. */
  acceptFour: number;
  acceptEight: number;
}

/**
 * e^(-x) for x ≥ 0 using only + − × ÷. Browsers must round those identically,
 * but not `Math.exp`, so this keeps shared links replaying exactly everywhere.
 */
export function expNegative(x: number): number {
  // e^(-x) = (e^(-r))^(2^k) with r = x / 2^k ≤ 1/2, where a short Taylor series converges.
  let r = x;
  let k = 0;
  while (r > 0.5) {
    r /= 2;
    k++;
  }
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 20; n++) {
    term = (term * -r) / n;
    sum += term;
  }
  for (let i = 0; i < k; i++) sum *= sum;
  return sum;
}

function setTemperature(state: IsingState, temperature: number): void {
  state.temperature = temperature;
  state.acceptFour = expNegative(4 / temperature);
  state.acceptEight = expNegative(8 / temperature);
}

export const isingSimulation: Simulation<IsingParams, IsingState> = {
  create(params, seed) {
    const n = params.side * params.side;
    const rng = createRng(seed);
    const spins = new Int8Array(n);
    let magnetization = 0;
    for (let i = 0; i < n; i++) {
      spins[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      magnetization += spins[i];
    }
    const state: IsingState = {
      side: params.side,
      rng,
      spins,
      sweeps: 0,
      magnetization,
      temperature: 0,
      acceptFour: 0,
      acceptEight: 0,
    };
    setTemperature(state, params.temperature);
    return state;
  },

  step(state, params) {
    // Temperature is live: a change applies from the next sweep on.
    if (params.temperature !== state.temperature) setTemperature(state, params.temperature);

    const { side, spins, rng, acceptFour, acceptEight } = state;
    const n = side * side;
    for (let attempt = 0; attempt < n; attempt++) {
      const site = nextInt(rng, n);
      const col = site % side;
      const up = site < side ? site + n - side : site - side;
      const down = site >= n - side ? site - n + side : site + side;
      const left = col === 0 ? site + side - 1 : site - 1;
      const right = col === side - 1 ? site - side + 1 : site + 1;
      // Flipping s changes the energy by 2·s·(sum of its four neighbors): -8, -4, 0, 4 or 8.
      const delta = 2 * spins[site] * (spins[up] + spins[down] + spins[left] + spins[right]);
      if (delta <= 0 || nextFloat(rng) < (delta === 4 ? acceptFour : acceptEight)) {
        spins[site] = -spins[site];
        state.magnetization += 2 * spins[site];
      }
    }
    state.sweeps++;
  },
};
