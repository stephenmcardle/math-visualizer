import { describe, expect, it } from "vitest";

import { LocalSimulationRunner } from "@/lib/simulation/runner";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import { defaultParams } from "@/lib/url-state/params";
import { isingParams, type IsingParams } from "@/visualizations/ising-model/params";
import {
  expNegative,
  isingSimulation,
  type IsingState,
} from "@/visualizations/ising-model/simulation";

const params: IsingParams = { ...defaultParams(isingParams), side: 32 };

function run(seed: number, sweeps: number, p: IsingParams = params): IsingState {
  const state = isingSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) isingSimulation.step(state, p);
  return state;
}

function sum(spins: Int8Array): number {
  return spins.reduce((total, s) => total + s, 0);
}

/** Order parameter |m| averaged over the sweeps after a burn-in. */
function meanAbsMagnetization(p: IsingParams, seed: number): number {
  const state = run(seed, 300, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    isingSimulation.step(state, p);
    total += Math.abs(state.magnetization) / state.spins.length;
  }
  return total / 200;
}

describe("expNegative", () => {
  it("matches Math.exp over the range the simulation uses", () => {
    for (let x = 0; x <= 16; x += 0.01) {
      expect(Math.abs(expNegative(x) / Math.exp(-x) - 1)).toBeLessThan(1e-13);
    }
  });
});

describe("Ising simulation", () => {
  it("starts from random or all-up spins", () => {
    const random = isingSimulation.create(params, 1);
    expect(random.spins.every((s) => s === 1 || s === -1)).toBe(true);
    expect(Math.abs(random.magnetization)).toBeLessThan(150);
    const up = isingSimulation.create({ ...params, start: "up" }, 1);
    expect(up.spins.every((s) => s === 1)).toBe(true);
    expect(up.magnetization).toBe(32 * 32);
  });

  it("keeps the magnetization equal to the sum of the spins", () => {
    const state = isingSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      isingSimulation.step(state, params);
      expect(state.magnetization).toBe(sum(state.spins));
    }
    expect(state.sweeps).toBe(20);
  });

  it("orders below the critical temperature and stays disordered above it", () => {
    // Onsager–Yang: the spontaneous magnetization is about 0.986 at T = 1.5 and zero above
    // T_c ≈ 2.269. On a finite lattice |m| at T = 4 is small but not zero.
    expect(meanAbsMagnetization({ ...params, temperature: 1.5, start: "up" }, 1)).toBeGreaterThan(
      0.95,
    );
    expect(meanAbsMagnetization({ ...params, temperature: 4 }, 1)).toBeLessThan(0.15);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    const hot = { ...params, temperature: 5 };
    isingSimulation.step(state, hot);
    expect(state.temperature).toBe(5);
    expect(state.acceptEight).toBe(expNegative(8 / 5));
  });

  it("is seeded: the same seed replays exactly, a different one doesn't", () => {
    expect(Array.from(run(7, 10).spins)).toEqual(Array.from(run(7, 10).spins));
    expect(Array.from(run(8, 10).spins)).not.toEqual(Array.from(run(7, 10).spins));
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    const checksum = state.spins.reduce((total, s, i) => total + (i + 1) * s, 0);
    expect(state.magnetization).toBe(0);
    expect(checksum).toBe(-83098);
    expect(state.acceptFour).toBe(0.17168145287472608);
    expect(state.acceptEight).toBe(0.029474521261176792);
  });

  it("is independent of how steps are batched", () => {
    const runner = new LocalSimulationRunner(isingSimulation);
    runner.reset(params, 99);
    for (const batch of [1, 0, 4, 2]) runner.advance(params, batch);
    expect(Array.from(runner.current()!.state.spins)).toEqual(Array.from(run(99, 7).spins));
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((slug) =>
      slug === "ising-model" ? (isingSimulation as never) : undefined,
    );
    handle({ type: "reset", slug: "ising-model", params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 4, generation: 1 });
    const response = handle({ type: "advance", params, steps: 3, generation: 1 });
    expect(response?.type).toBe("snapshot");
    const state = (response as { state: IsingState }).state;
    expect(Array.from(state.spins)).toEqual(Array.from(run(99, 7).spins));
  });
});
