import { describe, expect, it } from "vitest";

import { LocalSimulationRunner } from "@/lib/simulation/runner";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import { defaultParams } from "@/lib/url-state/params";
import { percolationParams, type PercolationParams } from "@/visualizations/percolation/params";
import {
  percolationSimulation,
  SPANS,
  type PercolationState,
} from "@/visualizations/percolation/simulation";

const params: PercolationParams = { ...defaultParams(percolationParams), side: 32 };

function run(seed: number, steps: number, p: PercolationParams = params): PercolationState {
  const state = percolationSimulation.create(p, seed);
  for (let i = 0; i < steps; i++) percolationSimulation.step(state, p);
  return state;
}

/** Reference labeling by flood fill: cluster index per open site, -1 for closed. */
function floodFill(state: PercolationState): Int32Array {
  const { side, label } = state;
  const component = new Int32Array(side * side).fill(-1);
  let count = 0;
  for (let start = 0; start < side * side; start++) {
    if (label[start] === -1 || component[start] !== -1) continue;
    const stack = [start];
    component[start] = count;
    while (stack.length > 0) {
      const site = stack.pop()!;
      const row = Math.floor(site / side);
      const col = site % side;
      const neighbors = [
        row > 0 ? site - side : -1,
        row < side - 1 ? site + side : -1,
        col > 0 ? site - 1 : -1,
        col < side - 1 ? site + 1 : -1,
      ];
      for (const n of neighbors) {
        if (n !== -1 && label[n] !== -1 && component[n] === -1) {
          component[n] = count;
          stack.push(n);
        }
      }
    }
    count++;
  }
  return component;
}

function spansByFloodFill(state: PercolationState): boolean {
  const { side } = state;
  const component = floodFill(state);
  const top = new Set<number>();
  for (let col = 0; col < side; col++) if (component[col] !== -1) top.add(component[col]);
  for (let col = 0; col < side; col++) {
    if (top.has(component[(side - 1) * side + col])) return true;
  }
  return false;
}

describe("percolation simulation", () => {
  it("starts with every site closed", () => {
    const state = percolationSimulation.create(params, 1);
    expect(state.opened).toBe(0);
    expect(state.label.every((l) => l === -1)).toBe(true);
    expect(state.spanningAt).toBe(-1);
  });

  it("opens each site exactly once, in a seeded order", () => {
    const n = params.side * params.side;
    const state = run(7, n + 10);
    expect(state.opened).toBe(n);
    expect(new Set(state.order).size).toBe(n);
    expect(Array.from(run(7, 50).order.slice(0, 50))).toEqual(Array.from(state.order.slice(0, 50)));
    expect(Array.from(run(8, 50).order.slice(0, 50))).not.toEqual(
      Array.from(state.order.slice(0, 50)),
    );
  });

  it("matches a flood-fill labeling of clusters throughout a sweep", () => {
    const n = params.side * params.side;
    const state = percolationSimulation.create(params, 2024);
    for (const target of [1, 10, 200, Math.floor(n * 0.55), Math.floor(n * 0.6), n]) {
      while (state.opened < target) percolationSimulation.step(state, params);
      const reference = floodFill(state);
      // Same partition: two open sites share a label iff they share a component.
      const labelOf = new Map<number, number>();
      for (let site = 0; site < n; site++) {
        expect(state.label[site] === -1).toBe(reference[site] === -1);
        if (reference[site] === -1) continue;
        const seen = labelOf.get(reference[site]);
        if (seen === undefined) labelOf.set(reference[site], state.label[site]);
        else expect(state.label[site]).toBe(seen);
      }
      expect(new Set(labelOf.values()).size).toBe(labelOf.size);
      for (const id of labelOf.values()) {
        expect(state.size[id]).toBe(state.label.filter((l) => l === id).length);
      }
    }
  });

  it("records the first step at which a cluster spans top to bottom", () => {
    const state = percolationSimulation.create(params, 5);
    while (state.spanningAt === -1) {
      percolationSimulation.step(state, params);
      expect(spansByFloodFill(state)).toBe(state.spanningAt !== -1);
    }
    expect(state.spanningAt).toBe(state.opened);
    expect(state.edges[state.label[state.order[state.opened - 1]]]).toBe(SPANS);
  });

  it("ends as one cluster covering the lattice", () => {
    const n = params.side * params.side;
    const state = run(3, n);
    const id = state.label[0];
    expect(state.label.every((l) => l === id)).toBe(true);
    expect(state.size[id]).toBe(n);
  });

  it("spans near the known threshold p_c ≈ 0.5927 on average", () => {
    const p: PercolationParams = { ...params, side: 64 };
    const n = p.side * p.side;
    let total = 0;
    const seeds = 40;
    for (let seed = 1; seed <= seeds; seed++) {
      const state = percolationSimulation.create(p, seed);
      while (state.spanningAt === -1) percolationSimulation.step(state, p);
      total += state.spanningAt / n;
    }
    // Finite-size estimates scatter around p_c; a loose band still catches a
    // wrong neighborhood or spanning rule (bond-style or 8-neighbor rules land far away).
    expect(total / seeds).toBeGreaterThan(0.56);
    expect(total / seeds).toBeLessThan(0.63);
  });

  it("is deterministic and independent of how steps are batched", () => {
    const runner = new LocalSimulationRunner(percolationSimulation);
    runner.reset(params, 99);
    for (const batch of [1, 7, 0, 300, 192]) runner.advance(params, batch);
    const batched = runner.current()!.state;
    const straight = run(99, 500);
    expect(Array.from(batched.label)).toEqual(Array.from(straight.label));
    expect(batched.spanningAt).toBe(straight.spanningAt);
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((slug) =>
      slug === "percolation" ? (percolationSimulation as never) : undefined,
    );
    handle({ type: "reset", slug: "percolation", params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 300, generation: 1 });
    const response = handle({ type: "advance", params, steps: 200, generation: 1 });
    expect(response?.type).toBe("snapshot");
    const state = (response as { state: PercolationState }).state;
    expect(Array.from(state.label)).toEqual(Array.from(run(99, 500).label));
  });
});
