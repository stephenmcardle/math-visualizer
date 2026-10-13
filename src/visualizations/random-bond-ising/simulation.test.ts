import { describe, expect, it } from "vitest";

import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import {
  randomBondIsingParams,
  type RandomBondIsingParams,
} from "@/visualizations/random-bond-ising/params";
import {
  criticalBeta,
  randomBondIsingSimulation,
  type RandomBondIsingState,
} from "@/visualizations/random-bond-ising/simulation";

const params: RandomBondIsingParams = { ...defaultParams(randomBondIsingParams), side: 32 };

function run(seed: number, sweeps: number, p: RandomBondIsingParams = params) {
  const state = randomBondIsingSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) randomBondIsingSimulation.step(state, p);
  return state;
}

function sum(values: Int8Array): number {
  return values.reduce((total, v) => total + v, 0);
}

describe("random-bond Ising simulation", () => {
  latticeContractTests("random-bond-ising", randomBondIsingSimulation, params, (s) =>
    Array.from(s.spins),
  );

  it("puts the critical point on the self-dual curve, and at Onsager's without disorder", () => {
    expect(criticalBeta(0)).toBeCloseTo(Math.log(1 + Math.SQRT2) / 2, 14);
    for (const e of [0.1, 0.5, 0.9]) {
      const beta = criticalBeta(e);
      expect(Math.sinh(2 * (1 + e) * beta) * Math.sinh(2 * (1 - e) * beta)).toBeCloseTo(1, 12);
    }
  });

  it("draws strong and weak bonds in about equal numbers", () => {
    const state = randomBondIsingSimulation.create({ ...params, side: 64 }, 1);
    expect(state.eastBonds.every((b) => b === 1 || b === -1)).toBe(true);
    expect(Math.abs(sum(state.eastBonds) + sum(state.southBonds))).toBeLessThan(300);
  });

  it("keeps the magnetization equal to the sum of the spins", () => {
    const state = randomBondIsingSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      randomBondIsingSimulation.step(state, params);
      expect(state.magnetization).toBe(sum(state.spins));
    }
  });

  it("orders below the critical temperature and not above it, with strong disorder", () => {
    // Measured on 32 × 32 with ε = 0.6: |m| about 0.93 at 0.8 T_c and below 0.15 at 1.3 T_c.
    const mean = (relativeTemperature: number) => {
      const p = { ...params, disorder: 0.6, relativeTemperature, start: "up" };
      const state = run(1, 300, p);
      let total = 0;
      for (let i = 0; i < 200; i++) {
        randomBondIsingSimulation.step(state, p);
        total += Math.abs(state.magnetization) / state.spins.length;
      }
      return total / 200;
    };

    expect(mean(0.8)).toBeGreaterThan(0.85);
    expect(mean(1.3)).toBeLessThan(0.2);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    randomBondIsingSimulation.step(state, { ...params, relativeTemperature: 2 });
    expect(state.relativeTemperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state: RandomBondIsingState = run(12345, 20);
    expect(state.magnetization).toBe(-302);
    expect(checksum(state.spins)).toBe(-98138);
    expect(checksum(state.eastBonds) + checksum(state.southBonds)).toBe(-4456);
    expect(state.criticalBeta).toBe(0.45374840219490853);
  });
});
