import { describe, expect, it } from "vitest";

import { LocalSimulationRunner } from "@/lib/simulation/runner";
import { defaultParams } from "@/lib/url-state/params";
import { lorenzParams, type LorenzParams } from "@/visualizations/lorenz-attractor/params";
import {
  BETA,
  DT,
  lorenzSimulation,
  startingCenter,
  type LorenzState,
} from "@/visualizations/lorenz-attractor/simulation";

const params: LorenzParams = { ...defaultParams(lorenzParams), trajectories: 20 };

function run(seed: number, steps: number, p: LorenzParams = params): LorenzState {
  const state = lorenzSimulation.create(p, seed);
  for (let i = 0; i < steps; i++) lorenzSimulation.step(state, p);
  return state;
}

function at(state: LorenzState, i: number): [number, number, number] {
  return [state.x[i], state.y[i], state.z[i]];
}

describe("Lorenz simulation", () => {
  it("starts every trajectory inside the seeded cube", () => {
    const state = lorenzSimulation.create({ ...params, spread: 0.01 }, 1);
    const center = startingCenter();
    expect(state.x).toHaveLength(20);
    for (let i = 0; i < 20; i++) {
      at(state, i).forEach((v, axis) =>
        expect(Math.abs(v - center[axis])).toBeLessThanOrEqual(0.005),
      );
    }
  });

  it("replays exactly: pinned positions after 2000 steps", () => {
    // Shared links depend on this. A change here means old URLs replay
    // differently; treat it as a breaking change, not a snapshot to update.
    const state = run(12345, 2000, { ...params, trajectories: 2 });
    expect(at(state, 0)).toEqual([2.654225045178531, -0.009583319816086788, 25.14829489568034]);
  });

  it("does not depend on how steps are batched into frames", () => {
    const runner = new LocalSimulationRunner(lorenzSimulation);
    runner.reset(params, 7);
    for (const batch of [1, 13, 0, 200, 86]) runner.advance(params, batch);
    const batched = runner.current()!.state;
    expect(Array.from(batched.x)).toEqual(Array.from(run(7, 300).x));
    expect(batched.step * DT).toBeCloseTo(1.5, 12);
  });

  it("stays at a nonzero fixed point C+", () => {
    const rho = 20;
    const c = Math.sqrt(BETA * (rho - 1));
    const state = lorenzSimulation.create({ ...params, trajectories: 1, rho }, 0);
    state.x[0] = c;
    state.y[0] = c;
    state.z[0] = rho - 1;
    for (let i = 0; i < 1000; i++) lorenzSimulation.step(state, params);
    expect(state.x[0]).toBeCloseTo(c, 9);
    expect(state.z[0]).toBeCloseTo(rho - 1, 9);
  });

  it("decays to the origin when ρ < 1", () => {
    const state = run(3, 20000, { ...params, rho: 0.5 });
    for (let i = 0; i < 20; i++) {
      at(state, i).forEach((v) => expect(Math.abs(v)).toBeLessThan(1e-6));
    }
  });

  it("stays on a bounded attractor at ρ = 28", () => {
    const state = run(4, 20000);
    for (let i = 0; i < 20; i++) {
      const [x, y, z] = at(state, i);
      expect(Math.abs(x)).toBeLessThan(30);
      expect(Math.abs(y)).toBeLessThan(35);
      expect(z).toBeGreaterThan(0);
      expect(z).toBeLessThan(60);
    }
  });

  it("separates nearby trajectories (sensitive dependence) at ρ = 28", () => {
    const state = run(5, 0, { ...params, trajectories: 2, spread: 1e-9 });
    const initial = Math.hypot(
      state.x[0] - state.x[1],
      state.y[0] - state.y[1],
      state.z[0] - state.z[1],
    );
    for (let i = 0; i < 8000; i++) lorenzSimulation.step(state, params); // t = 40
    const final = Math.hypot(
      state.x[0] - state.x[1],
      state.y[0] - state.y[1],
      state.z[0] - state.z[1],
    );
    expect(initial).toBeLessThan(1e-9);
    expect(final).toBeGreaterThan(1);
  });
});
