import { describe, expect, it } from "vitest";

import { ANGLE_STEPS } from "@/lib/math/angles";
import { createRng, nextInt } from "@/lib/random/prng";
import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import { xyParams, type XyParams } from "@/visualizations/xy-model/params";
import { countVortices, xySimulation, type XyState } from "@/visualizations/xy-model/simulation";

const params: XyParams = { ...defaultParams(xyParams), side: 32 };

function run(seed: number, sweeps: number, p: XyParams = params): XyState {
  const state = xySimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) xySimulation.step(state, p);
  return state;
}

/** Vortices per site, averaged over 200 sweeps after 200 of burn-in. */
function vortexDensity(temperature: number): number {
  const p = { ...params, temperature, start: "up" };
  const state = run(1, 200, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    xySimulation.step(state, p);
    total += countVortices(state).vortices / state.angles.length;
  }
  return total / 200;
}

describe("XY simulation", () => {
  latticeContractTests("xy-model", xySimulation, params, (s) => Array.from(s.angles));

  it("counts a vortex where the angle turns once around a plaquette", () => {
    const state = xySimulation.create({ ...params, side: 4, start: "up" }, 1);
    expect(countVortices(state)).toEqual({ vortices: 0, antivortices: 0 });
    // Going round the top-left plaquette (right, down, left, up) the angle steps a
    // quarter turn each time: one full turn forward. One step short of a half turn at
    // site 5 keeps every difference with the aligned sites unambiguous.
    state.angles.set([0, ANGLE_STEPS / 4], 0);
    state.angles.set([(3 * ANGLE_STEPS) / 4, ANGLE_STEPS / 2 - 1], 4);
    const { vortices, antivortices } = countVortices(state);
    expect(vortices).toBe(1);
    // On a torus the windings add up to zero, so an antivortex forms nearby.
    expect(antivortices).toBe(1);
  });

  it("has as many antivortices as vortices in any configuration on the torus", () => {
    const { vortices, antivortices } = countVortices(run(3, 5));
    expect(vortices).toBeGreaterThan(0);
    expect(antivortices).toBe(vortices);
  });

  it("balances vortices even across neighbors exactly half a turn apart", () => {
    // Quarter-turn angles put many neighbors exactly half a turn apart, where the
    // shorter way round is a tie that both plaquettes beside the bond must break alike.
    const state = xySimulation.create({ ...params, side: 32, start: "up" }, 1);
    const rng = createRng(9);
    for (let i = 0; i < state.angles.length; i++) {
      state.angles[i] = nextInt(rng, 4) * (ANGLE_STEPS / 4);
    }
    const { vortices, antivortices } = countVortices(state);
    expect(vortices).toBeGreaterThan(0);
    expect(antivortices).toBe(vortices);
  });

  it("binds its vortices below the transition and frees them above it", () => {
    // Measured on 32 × 32: about 0.0004 vortices per site at T = 0.7 and 0.07 at T = 1.5.
    expect(vortexDensity(0.7)).toBeLessThan(0.003);
    expect(vortexDensity(1.5)).toBeGreaterThan(0.03);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    xySimulation.step(state, { ...params, temperature: 2 });
    expect(state.temperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    expect(checksum(state.angles)).toBe(16676296176);
    expect(countVortices(state)).toEqual({ vortices: 22, antivortices: 22 });
  });
});
