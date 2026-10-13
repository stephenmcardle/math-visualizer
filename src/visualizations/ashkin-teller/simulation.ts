import { bisect, expNegative, sinhPositive } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { AshkinTellerParams } from "@/visualizations/ashkin-teller/params";

/**
 * The Ashkin–Teller model: two Ising spins σ and τ per site, with energy
 * −Σ (σσ′ + ττ′ + K·σσ′ττ′) over neighboring pairs. Each Metropolis attempt
 * proposes flipping σ, τ or both, chosen uniformly.
 */
export interface AshkinTellerFields {
  coupling: number;
  sigma: Int8Array;
  tau: Int8Array;
  /** Sums of σ, of τ and of στ over all sites, kept up to date. */
  sigmaSum: number;
  tauSum: number;
  productSum: number;
  /** 1/T_c on the self-dual curve: sinh(2β) = e^(−2Kβ). */
  criticalBeta: number;
  relativeTemperature: number;
  /**
   * Acceptance by (x, y), each −4 to 4 in steps of 2, at index ((x + 4) / 2) · 5 + (y + 4) / 2.
   * `single`: flipping one layer, energy change 2(x + K·y) with x that layer's local sum and y
   * the product's. `both`: flipping both, energy change 2(x + y) with the two layers' sums.
   */
  single: Float64Array;
  both: Float64Array;
}

export type AshkinTellerState = LatticeState<AshkinTellerFields>;

/**
 * The self-dual curve sinh(2β) = e^(−2Kβ), where both transitions happen for
 * 0 ≤ K ≤ 1 (Aoun, Dober and Glazman). K = 0 gives Onsager's Ising point and K = 1
 * the 4-state Potts point.
 */
export function criticalBeta(coupling: number): number {
  return bisect((beta) => sinhPositive(2 * beta) - expNegative(2 * coupling * beta), 0, 4);
}

const index = (x: number, y: number) => ((x + 4) / 2) * 5 + (y + 4) / 2;

function setTemperature(fields: AshkinTellerFields, relativeTemperature: number): void {
  fields.relativeTemperature = relativeTemperature;
  const beta = fields.criticalBeta / relativeTemperature;
  for (let x = -4; x <= 4; x += 2) {
    for (let y = -4; y <= 4; y += 2) {
      const single = 2 * (x + fields.coupling * y);
      const both = 2 * (x + y);
      fields.single[index(x, y)] = single <= 0 ? 1 : expNegative(single * beta);
      fields.both[index(x, y)] = both <= 0 ? 1 : expNegative(both * beta);
    }
  }
}

const ashkinTellerModel: LatticeModel<AshkinTellerParams, AshkinTellerFields> = {
  init(side, params, rng) {
    const n = side * side;
    const sigma = new Int8Array(n);
    const tau = new Int8Array(n);
    let sigmaSum = 0;
    let tauSum = 0;
    let productSum = 0;
    for (let i = 0; i < n; i++) {
      sigma[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      tau[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      sigmaSum += sigma[i];
      tauSum += tau[i];
      productSum += sigma[i] * tau[i];
    }
    const fields = {
      coupling: params.coupling,
      sigma,
      tau,
      sigmaSum,
      tauSum,
      productSum,
      criticalBeta: criticalBeta(params.coupling),
      relativeTemperature: 0,
      single: new Float64Array(25),
      both: new Float64Array(25),
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
    const { sigma, tau, rng } = state;
    const s = sigma[site];
    const t = tau[site];
    const sigmaField = s * (sigma[north] + sigma[south] + sigma[west] + sigma[east]);
    const tauField = t * (tau[north] + tau[south] + tau[west] + tau[east]);
    const productField =
      s *
      t *
      (sigma[north] * tau[north] +
        sigma[south] * tau[south] +
        sigma[west] * tau[west] +
        sigma[east] * tau[east]);
    const move = nextInt(rng, 3);
    let delta: number;
    let accept: number;
    if (move === 0) {
      delta = sigmaField + state.coupling * productField;
      accept = state.single[index(sigmaField, productField)];
    } else if (move === 1) {
      delta = tauField + state.coupling * productField;
      accept = state.single[index(tauField, productField)];
    } else {
      delta = sigmaField + tauField;
      accept = state.both[index(sigmaField, tauField)];
    }
    if (delta > 0 && nextFloat(rng) >= accept) return;
    if (move !== 1) {
      sigma[site] = -s;
      state.sigmaSum -= 2 * s;
    }
    if (move !== 0) {
      tau[site] = -t;
      state.tauSum -= 2 * t;
    }
    // Flipping one layer flips the product; flipping both leaves it.
    if (move !== 2) state.productSum -= 2 * s * t;
  },
};

export const ashkinTellerSimulation = latticeSimulation(ashkinTellerModel);
