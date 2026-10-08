/**
 * Messages between `WorkerSimulationRunner` (main thread) and
 * `src/workers/simulation.worker.ts`. The handler is a plain function so the
 * worker's behavior can be unit tested without spawning a real Worker.
 */

import type { Simulation } from "@/lib/simulation/types";

export type WorkerRequest =
  | { type: "reset"; slug: string; params: unknown; seed: number; generation: number }
  | { type: "advance"; params: unknown; steps: number; generation: number };

export type WorkerResponse =
  { type: "snapshot"; state: unknown; generation: number } | { type: "error"; message: string };

export type SimulationLookup = (slug: string) => Simulation<unknown, unknown> | undefined;

/**
 * Returns a stateful request handler. Snapshots are sent by structured clone;
 * a simulation whose state is mostly TypedArrays could later switch to
 * transferring copies of its buffers without changing this protocol.
 */
export function createWorkerHandler(lookup: SimulationLookup) {
  let simulation: Simulation<unknown, unknown> | undefined;
  let state: unknown;
  let generation = -1;

  return function handle(request: WorkerRequest): WorkerResponse | null {
    if (request.type === "reset") {
      simulation = lookup(request.slug);
      if (!simulation) {
        return { type: "error", message: `No worker simulation registered for "${request.slug}"` };
      }
      state = simulation.create(request.params, request.seed);
      generation = request.generation;
      return { type: "snapshot", state, generation };
    }

    // An advance for a run that has since been reset: drop it.
    if (request.generation !== generation || !simulation) return null;
    for (let i = 0; i < request.steps; i++) simulation.step(state, request.params);
    return { type: "snapshot", state, generation };
  };
}
