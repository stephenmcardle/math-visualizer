import { describe, expect, it } from "vitest";

import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import { o3Params, type O3Params } from "@/visualizations/o3-model/params";
import {
  magnetization,
  o3Simulation,
  sphereTables,
  type O3State,
} from "@/visualizations/o3-model/simulation";

const params: O3Params = { ...defaultParams(o3Params), side: 32 };

function run(seed: number, sweeps: number, p: O3Params = params): O3State {
  const state = o3Simulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) o3Simulation.step(state, p);
  return state;
}

/** |m| averaged over 200 sweeps after 200 of burn-in, from a cold start. */
function meanMagnetization(temperature: number, side: number): number {
  const p = { ...params, side, temperature, start: "up" };
  const state = run(1, 200, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    o3Simulation.step(state, p);
    total += magnetization(state);
  }
  return total / 200;
}

describe("O(3) simulation", () => {
  latticeContractTests("o3-model", o3Simulation, params, (s) => [...s.heights, ...s.longitudes]);

  it("stores unit vectors, spread evenly over the sphere", () => {
    const { height, radius } = sphereTables();
    for (let k = 0; k < height.length; k += 101) {
      expect(height[k] ** 2 + radius[k] ** 2).toBeCloseTo(1, 14);
    }
    // Uniform random directions average out to nearly nothing.
    expect(magnetization(o3Simulation.create({ ...params, side: 64 }, 1))).toBeLessThan(0.03);
    expect(magnetization(o3Simulation.create({ ...params, start: "up" }, 1))).toBeCloseTo(1, 4);
  });

  it("loses its magnetization as the grid grows: correlations decay exponentially", () => {
    // Measured at T = 1: |m| about 0.17 on 16 × 16, 0.085 on 32 × 32 and 0.04 on 64 × 64.
    expect(meanMagnetization(1, 64)).toBeLessThan(meanMagnetization(1, 16) / 2);
  });

  it("looks ordered at low temperature on a small grid, since the correlation length exceeds it", () => {
    // Measured: about 0.7 at T = 0.5 on 32 × 32.
    expect(meanMagnetization(0.5, 32)).toBeGreaterThan(0.5);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    o3Simulation.step(state, { ...params, temperature: 2 });
    expect(state.temperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    expect([checksum(state.heights), checksum(state.longitudes)]).toEqual([
      16696509262, 15556540896,
    ]);
    expect(magnetization(state)).toBe(0.11403610668833297);
  });
});
