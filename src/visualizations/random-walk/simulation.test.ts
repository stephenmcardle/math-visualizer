import { describe, expect, it } from "vitest";

import { LocalSimulationRunner } from "@/lib/simulation/runner";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import { defaultParams } from "@/lib/url-state/params";
import { randomWalkParams, type RandomWalkParams } from "@/visualizations/random-walk/params";
import {
  randomWalkSimulation,
  type RandomWalkState,
} from "@/visualizations/random-walk/simulation";

const params: RandomWalkParams = { ...defaultParams(randomWalkParams), walkers: 50, stepSize: 2 };

function run(seed: number, steps: number, p: RandomWalkParams = params): RandomWalkState {
  const state = randomWalkSimulation.create(p, seed);
  for (let i = 0; i < steps; i++) randomWalkSimulation.step(state, p);
  return state;
}

describe("random walk simulation", () => {
  it("starts every walker at the origin", () => {
    const state = randomWalkSimulation.create(params, 1);
    expect(state.x).toHaveLength(50);
    expect(state.x.every((v) => v === 0) && state.y.every((v) => v === 0)).toBe(true);
  });

  it("is deterministic for the same seed and params", () => {
    const a = run(12345, 500);
    const b = run(12345, 500);
    expect(Array.from(a.x)).toEqual(Array.from(b.x));
    expect(Array.from(a.y)).toEqual(Array.from(b.y));
    expect(a.step).toBe(500);
  });

  it("diverges for different seeds", () => {
    expect(Array.from(run(1, 10).x)).not.toEqual(Array.from(run(2, 10).x));
  });

  it("moves each walker exactly stepSize per step", () => {
    const state = randomWalkSimulation.create(params, 3);
    randomWalkSimulation.step(state, params);
    for (let i = 0; i < state.x.length; i++) {
      expect(Math.hypot(state.x[i], state.y[i])).toBeCloseTo(params.stepSize, 10);
    }
  });

  it("does not depend on how steps are batched into frames", () => {
    const runner = new LocalSimulationRunner(randomWalkSimulation);
    runner.reset(params, 99);
    for (const batch of [1, 7, 0, 30, 62]) runner.advance(params, batch);
    expect(Array.from(runner.current()!.state.x)).toEqual(Array.from(run(99, 100).x));
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((slug) =>
      slug === "random-walk" ? (randomWalkSimulation as never) : undefined,
    );
    handle({ type: "reset", slug: "random-walk", params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 60, generation: 1 });
    const response = handle({ type: "advance", params, steps: 40, generation: 1 });
    expect(response?.type).toBe("snapshot");
    const state = (response as { state: RandomWalkState }).state;
    expect(Array.from(state.x)).toEqual(Array.from(run(99, 100).x));
  });

  it("ignores worker advances for a superseded run", () => {
    const handle = createWorkerHandler(() => randomWalkSimulation as never);
    handle({ type: "reset", slug: "random-walk", params, seed: 1, generation: 2 });
    expect(handle({ type: "advance", params, steps: 5, generation: 1 })).toBeNull();
  });
});
