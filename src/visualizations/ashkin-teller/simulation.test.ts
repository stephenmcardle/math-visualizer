import { describe, expect, it } from "vitest";

import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import { ashkinTellerParams, type AshkinTellerParams } from "@/visualizations/ashkin-teller/params";
import {
  ashkinTellerSimulation,
  criticalBeta,
  type AshkinTellerState,
} from "@/visualizations/ashkin-teller/simulation";

const params: AshkinTellerParams = { ...defaultParams(ashkinTellerParams), side: 32 };

function run(seed: number, sweeps: number, p: AshkinTellerParams = params): AshkinTellerState {
  const state = ashkinTellerSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) ashkinTellerSimulation.step(state, p);
  return state;
}

describe("Ashkin–Teller simulation", () => {
  latticeContractTests("ashkin-teller", ashkinTellerSimulation, params, (s) => [
    ...s.sigma,
    ...s.tau,
  ]);

  it("puts the critical point on the self-dual curve, from Ising to 4-state Potts", () => {
    // K = 0: two Ising models. K = 1: the 4-state Potts model, where e^(4β) = 3.
    expect(criticalBeta(0)).toBeCloseTo(Math.log(1 + Math.SQRT2) / 2, 14);
    expect(criticalBeta(1)).toBeCloseTo(Math.log(3) / 4, 14);
    const beta = criticalBeta(0.5);
    expect(Math.sinh(2 * beta)).toBeCloseTo(Math.exp(-beta), 12);
  });

  it("keeps the three sums equal to the spins", () => {
    const state = ashkinTellerSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      ashkinTellerSimulation.step(state, params);
      let sigma = 0;
      let tau = 0;
      let product = 0;
      for (let j = 0; j < state.sigma.length; j++) {
        sigma += state.sigma[j];
        tau += state.tau[j];
        product += state.sigma[j] * state.tau[j];
      }
      expect([state.sigmaSum, state.tauSum, state.productSum]).toEqual([sigma, tau, product]);
    }
  });

  it("orders below the critical temperature and not above it, at the Potts point", () => {
    // Measured on 32 × 32 with K = 1: |⟨σ⟩| about 0.97 at 0.8 T_c and 0.05 at 1.3 T_c.
    const mean = (relativeTemperature: number) => {
      const p = { ...params, coupling: 1, relativeTemperature, start: "up" };
      const state = run(1, 300, p);
      let total = 0;
      for (let i = 0; i < 200; i++) {
        ashkinTellerSimulation.step(state, p);
        total += Math.abs(state.sigmaSum) / state.sigma.length;
      }
      return total / 200;
    };

    expect(mean(0.8)).toBeGreaterThan(0.8);
    expect(mean(1.3)).toBeLessThan(0.2);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    ashkinTellerSimulation.step(state, { ...params, relativeTemperature: 2 });
    expect(state.relativeTemperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    expect([state.sigmaSum, state.tauSum, state.productSum]).toEqual([272, -68, -64]);
    expect([checksum(state.sigma), checksum(state.tau)]).toEqual([89174, 20420]);
    expect(state.criticalBeta).toBe(0.333135959193923);
  });
});
