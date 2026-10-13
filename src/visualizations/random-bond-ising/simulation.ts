import { bisect, expNegative, sinhPositive } from "@/lib/math/deterministic";
import { nextFloat } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { RandomBondIsingParams } from "@/visualizations/random-bond-ising/params";

/**
 * The Ising model with random bonds: each bond between neighbors has strength
 * J = 1 + εξ, with ξ = ±1 drawn once per run (quenched disorder). Sampled with
 * the Metropolis algorithm on the lattice template's torus.
 */
export interface RandomBondIsingFields {
  disorder: number;
  /** ξ = ±1 of the bond from each site to its east and to its south neighbor. */
  eastBonds: Int8Array;
  southBonds: Int8Array;
  /** +1 or -1 per site, row-major. */
  spins: Int8Array;
  magnetization: number;
  /** 1/T_c for this disorder, from duality: sinh(2(1+ε)β) · sinh(2(1−ε)β) = 1. */
  criticalBeta: number;
  /** The relative temperature the acceptance table below was computed for. */
  relativeTemperature: number;
  /**
   * Acceptance probabilities by (s·Σ neighbors, s·Σ ξ·neighbor), each −4 to 4 in steps
   * of 2: index ((a + 4) / 2) · 5 + (b + 4) / 2. The energy change is 2(a + ε·b).
   */
  accept: Float64Array;
}

export type RandomBondIsingState = LatticeState<RandomBondIsingFields>;

/**
 * The self-dual point of the square lattice with bond strengths 1 ± ε in equal
 * proportion (Fisch 1978; Kinzel and Domany 1981). With ε = 0 it is Onsager's
 * 1/T_c = ln(1 + √2) / 2.
 */
export function criticalBeta(disorder: number): number {
  const strong = 2 * (1 + disorder);
  const weak = 2 * (1 - disorder);
  return bisect((beta) => sinhPositive(strong * beta) * sinhPositive(weak * beta) - 1, 0, 8);
}

function setTemperature(fields: RandomBondIsingFields, relativeTemperature: number): void {
  fields.relativeTemperature = relativeTemperature;
  const beta = fields.criticalBeta / relativeTemperature;
  for (let a = -4; a <= 4; a += 2) {
    for (let b = -4; b <= 4; b += 2) {
      const delta = 2 * (a + fields.disorder * b);
      fields.accept[((a + 4) / 2) * 5 + (b + 4) / 2] = delta <= 0 ? 1 : expNegative(delta * beta);
    }
  }
}

const randomBondIsingModel: LatticeModel<RandomBondIsingParams, RandomBondIsingFields> = {
  init(side, params, rng) {
    const n = side * side;
    // Bonds first, then spins, all from the run's generator.
    const eastBonds = new Int8Array(n);
    const southBonds = new Int8Array(n);
    for (let i = 0; i < n; i++) {
      eastBonds[i] = nextFloat(rng) < 0.5 ? 1 : -1;
      southBonds[i] = nextFloat(rng) < 0.5 ? 1 : -1;
    }
    const spins = new Int8Array(n);
    let magnetization = 0;
    for (let i = 0; i < n; i++) {
      spins[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      magnetization += spins[i];
    }
    const fields = {
      disorder: params.disorder,
      eastBonds,
      southBonds,
      spins,
      magnetization,
      criticalBeta: criticalBeta(params.disorder),
      relativeTemperature: 0,
      accept: new Float64Array(25),
    };
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
    const { spins, eastBonds, southBonds } = state;
    const s = spins[site];
    const a = s * (spins[north] + spins[south] + spins[west] + spins[east]);
    const b =
      s *
      (southBonds[north] * spins[north] +
        southBonds[site] * spins[south] +
        eastBonds[west] * spins[west] +
        eastBonds[site] * spins[east]);
    if (
      a + state.disorder * b <= 0 ||
      nextFloat(state.rng) < state.accept[((a + 4) / 2) * 5 + (b + 4) / 2]
    ) {
      spins[site] = -s;
      state.magnetization -= 2 * s;
    }
  },
};

export const randomBondIsingSimulation = latticeSimulation(randomBondIsingModel);
