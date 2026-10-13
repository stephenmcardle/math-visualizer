import { describe, expect, it } from "vitest";

import { expNegative } from "@/lib/math/deterministic";
import { LocalSimulationRunner } from "@/lib/simulation/runner";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import { defaultParams } from "@/lib/url-state/params";
import { majorityShare } from "@/visualizations/potts-model/describe";
import { pottsParams, type PottsParams } from "@/visualizations/potts-model/params";
import {
  CRITICAL_BETA,
  pottsSimulation,
  type PottsState,
} from "@/visualizations/potts-model/simulation";

const params: PottsParams = { ...defaultParams(pottsParams), side: 32 };

function run(seed: number, sweeps: number, p: PottsParams = params): PottsState {
  const state = pottsSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) pottsSimulation.step(state, p);
  return state;
}

/** Share of sites in the most common state, averaged over the sweeps after a burn-in. */
function meanMajorityShare(p: PottsParams, seed: number): number {
  const state = run(seed, 300, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    pottsSimulation.step(state, p);
    total += majorityShare(state);
  }
  return total / 200;
}

describe("Potts simulation", () => {
  it("stores ln(1 + √q) for every q it allows", () => {
    for (let q = pottsParams.q.min; q <= pottsParams.q.max; q++) {
      expect(CRITICAL_BETA[q]).toBeCloseTo(Math.log(1 + Math.sqrt(q)), 15);
    }
  });

  it("starts from random states or all in state 0", () => {
    const random = pottsSimulation.create({ ...params, q: 5 }, 1);
    expect(random.states.every((s) => s < 5)).toBe(true);
    expect(new Set(random.states).size).toBe(5);
    const cold = pottsSimulation.create({ ...params, start: "up" }, 1);
    expect(cold.states.every((s) => s === 0)).toBe(true);
    expect(Array.from(cold.counts)).toEqual([32 * 32, 0, 0]);
  });

  it("keeps the counts equal to the number of sites in each state", () => {
    const state = pottsSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      pottsSimulation.step(state, params);
      const counts = new Int32Array(params.q);
      for (const s of state.states) counts[s]++;
      expect(Array.from(state.counts)).toEqual(Array.from(counts));
    }
    expect(state.sweeps).toBe(20);
  });

  it("orders below the critical temperature and stays disordered above it", () => {
    // With q = 3 the share is about 0.99 at 0.7 T_c and about 0.36 at 2 T_c (1/q = 0.33).
    const cold = { ...params, relativeTemperature: 0.7, start: "up" };
    expect(meanMajorityShare(cold, 1)).toBeGreaterThan(0.95);
    expect(meanMajorityShare({ ...params, relativeTemperature: 2 }, 1)).toBeLessThan(0.4);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    pottsSimulation.step(state, { ...params, relativeTemperature: 2 });
    expect(state.relativeTemperature).toBe(2);
    expect(state.accept[4]).toBe(expNegative((4 * CRITICAL_BETA[3]) / 2));
  });

  it("is seeded: the same seed replays exactly, a different one doesn't", () => {
    expect(Array.from(run(7, 10).states)).toEqual(Array.from(run(7, 10).states));
    expect(Array.from(run(8, 10).states)).not.toEqual(Array.from(run(7, 10).states));
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    const checksum = state.states.reduce((total, s, i) => total + (i + 1) * s, 0);
    expect(Array.from(state.counts)).toEqual([398, 353, 273]);
    expect(checksum).toBe(503649);
    expect(state.accept[1]).toBe(0.3660254037844388);
    expect(state.accept[4]).toBe(0.01794919243112274);
  });

  it("is independent of how steps are batched", () => {
    const runner = new LocalSimulationRunner(pottsSimulation);
    runner.reset(params, 99);
    for (const batch of [1, 0, 4, 2]) runner.advance(params, batch);
    expect(Array.from(runner.current()!.state.states)).toEqual(Array.from(run(99, 7).states));
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((slug) =>
      slug === "potts-model" ? (pottsSimulation as never) : undefined,
    );
    handle({ type: "reset", slug: "potts-model", params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 4, generation: 1 });
    const response = handle({ type: "advance", params, steps: 3, generation: 1 });
    expect(response?.type).toBe("snapshot");
    const state = (response as { state: PottsState }).state;
    expect(Array.from(state.states)).toEqual(Array.from(run(99, 7).states));
  });
});
