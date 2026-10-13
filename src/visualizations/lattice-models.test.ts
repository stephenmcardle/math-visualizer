import { describe, expect, it } from "vitest";

import type { Simulation } from "@/lib/simulation/types";
import { defaultParams } from "@/lib/url-state/params";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";
import { randomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";

/** Onsager's critical temperature of the Ising model. */
const ISING_TC = 2 / Math.log(1 + Math.SQRT2);

/** Yang's spontaneous magnetization of the infinite Ising lattice below T_c. */
function yang(temperature: number): number {
  return Math.pow(1 - Math.pow(Math.sinh(2 / temperature), -4), 1 / 8);
}

/** |magnetization| per site, averaged over 400 sweeps after 300 sweeps of burn-in. */
function meanAbs<P, S>(simulation: Simulation<P, S>, params: P, m: (state: S) => number): number {
  const state = simulation.create(params, 1);
  for (let i = 0; i < 300; i++) simulation.step(state, params);
  let total = 0;
  for (let i = 0; i < 400; i++) {
    simulation.step(state, params);
    total += Math.abs(m(state));
  }
  return total / 400;
}

/**
 * Four models that reduce to the Ising model: Potts with 2 states (at half the
 * temperature), random-bond Ising with no disorder and Ashkin–Teller with no
 * coupling (each layer). Each has its own sampler and its own way of finding T_c,
 * so agreement checks both.
 */
function isingLike(relativeTemperature: number): Record<string, number> {
  const side = 32;
  const start = "up";
  return {
    ising: meanAbs(
      isingSimulation,
      { ...defaultParams(isingParams), side, start, temperature: relativeTemperature * ISING_TC },
      (s) => s.magnetization / s.spins.length,
    ),
    potts: meanAbs(
      pottsSimulation,
      { ...defaultParams(pottsParams), side, start, q: 2, relativeTemperature },
      (s) => (s.counts[0] - s.counts[1]) / s.states.length,
    ),
    randomBond: meanAbs(
      randomBondIsingSimulation,
      { ...defaultParams(randomBondIsingParams), side, start, disorder: 0, relativeTemperature },
      (s) => s.magnetization / s.spins.length,
    ),
    ashkinTeller: meanAbs(
      ashkinTellerSimulation,
      { ...defaultParams(ashkinTellerParams), side, start, coupling: 0, relativeTemperature },
      (s) => s.sigmaSum / s.sigma.length,
    ),
  };
}

describe("models that reduce to the Ising model", () => {
  it("match Yang's magnetization below the critical temperature", () => {
    // Measured: every model within 0.002 of Yang at 0.8 T_c and within 0.01 at 0.9 T_c.
    for (const [r, tolerance] of [
      [0.8, 0.01],
      [0.9, 0.02],
    ]) {
      for (const [model, m] of Object.entries(isingLike(r))) {
        expect(Math.abs(m - yang(r * ISING_TC)), `${model} at ${r} T_c`).toBeLessThan(tolerance);
      }
    }
  });

  it("all lose their magnetization above it", () => {
    // Measured: 0.08 to 0.12 on a 32 × 32 grid at 1.3 T_c, where the infinite lattice has 0.
    for (const [model, m] of Object.entries(isingLike(1.3))) {
      expect(m, model).toBeLessThan(0.15);
    }
  });
});
