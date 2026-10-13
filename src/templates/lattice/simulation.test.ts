import { describe, expect, it } from "vitest";

import { createRng, nextInt } from "@/lib/random/prng";
import { latticeSimulation, type LatticeModel } from "@/templates/lattice/simulation";

interface Visits {
  /** Attempts per site, and the neighbors each attempt was given. */
  visits: Int32Array;
  calls: { site: number; north: number; south: number; west: number; east: number }[];
  prepared: number;
}

/** A model that changes nothing and records what the template asks of it. */
const recorder: LatticeModel<{ side: number }, Visits> = {
  init: (side) => ({ visits: new Int32Array(side * side), calls: [], prepared: 0 }),
  prepare(state) {
    state.prepared++;
  },
  attempt(state, site, north, south, west, east) {
    state.visits[site]++;
    state.calls.push({ site, north, south, west, east });
  },
};
const simulation = latticeSimulation(recorder);

describe("lattice template", () => {
  it("makes side² attempts per sweep and prepares once per sweep", () => {
    const state = simulation.create({ side: 4 }, 1);
    simulation.step(state, { side: 4 });
    simulation.step(state, { side: 4 });
    expect(state.sweeps).toBe(2);
    expect(state.prepared).toBe(2);
    expect(state.visits.reduce((a, b) => a + b, 0)).toBe(32);
  });

  it("picks sites with nextInt from the state's generator, in order", () => {
    // Ported models replay old links only if the template draws exactly as they did.
    const state = simulation.create({ side: 4 }, 9);
    simulation.step(state, { side: 4 });
    const rng = createRng(9);
    expect(state.calls.map((c) => c.site)).toEqual(
      Array.from({ length: 16 }, () => nextInt(rng, 16)),
    );
  });

  it("passes the four neighbors on the torus", () => {
    const state = simulation.create({ side: 4 }, 3);
    for (let i = 0; i < 20; i++) simulation.step(state, { side: 4 });
    // On a 4 × 4 torus, site 0 (top left) has neighbors 12 above, 4 below, 3 left, 1 right.
    const corner = state.calls.find((c) => c.site === 0)!;
    expect(corner).toEqual({ site: 0, north: 12, south: 4, west: 3, east: 1 });
    const middle = state.calls.find((c) => c.site === 5)!;
    expect(middle).toEqual({ site: 5, north: 1, south: 9, west: 4, east: 6 });
    const last = state.calls.find((c) => c.site === 15)!;
    expect(last).toEqual({ site: 15, north: 11, south: 3, west: 14, east: 12 });
  });
});
