import type { Simulation } from "@/lib/simulation/types";
import { percolationSimulation } from "@/visualizations/percolation/simulation";

/**
 * Simulations the worker can run, by slug. Kept separate from the main
 * registry so the worker bundle contains only pure simulation code, never
 * renderers or MDX. A definition with `execution: "worker"` must appear here
 * (enforced by a test).
 */
export const workerSimulations: Record<string, Simulation<unknown, unknown>> = {
  percolation: percolationSimulation as Simulation<unknown, unknown>,
};
