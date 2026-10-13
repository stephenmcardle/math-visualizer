import { expect, it } from "vitest";

import { LocalSimulationRunner } from "@/lib/simulation/runner";
import type { Simulation } from "@/lib/simulation/types";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import type { LatticeBase } from "@/templates/lattice/simulation";

/**
 * Tests every lattice model must pass, for use inside a model's `describe`. Only
 * test files import this. `sites` returns the model's per-site data as numbers,
 * so two states can be compared.
 */
export function latticeContractTests<P, S extends LatticeBase>(
  slug: string,
  simulation: Simulation<P, S>,
  params: P,
  sites: (state: S) => number[],
): void {
  const run = (seed: number, sweeps: number) => {
    const state = simulation.create(params, seed);
    for (let i = 0; i < sweeps; i++) simulation.step(state, params);
    return state;
  };

  it("counts sweeps, and is seeded: the same seed replays exactly, a different one doesn't", () => {
    expect(run(7, 10).sweeps).toBe(10);
    expect(sites(run(7, 10))).toEqual(sites(run(7, 10)));
    expect(sites(run(8, 10))).not.toEqual(sites(run(7, 10)));
  });

  it("is independent of how steps are batched", () => {
    const runner = new LocalSimulationRunner(simulation);
    runner.reset(params, 99);
    for (const batch of [1, 0, 4, 2]) runner.advance(params, batch);
    expect(sites(runner.current()!.state)).toEqual(sites(run(99, 7)));
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((name) =>
      name === slug ? (simulation as never) : undefined,
    );
    handle({ type: "reset", slug, params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 4, generation: 1 });
    const response = handle({ type: "advance", params, steps: 3, generation: 1 });
    expect(response?.type).toBe("snapshot");
    expect(sites((response as { state: S }).state)).toEqual(sites(run(99, 7)));
  });
}

/** Σ (i + 1) · value over sites: one number that changes if any site does. */
export function checksum(values: ArrayLike<number>): number {
  let total = 0;
  for (let i = 0; i < values.length; i++) total += (i + 1) * values[i];
  return total;
}
