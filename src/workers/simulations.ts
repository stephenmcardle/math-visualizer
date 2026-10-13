import type { Simulation } from "@/lib/simulation/types";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
import { percolationSimulation } from "@/visualizations/percolation/simulation";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";

/**
 * Simulations the worker can run, by slug. Kept separate from the main
 * registry so the worker bundle contains only pure simulation code, never
 * renderers or MDX. A definition with `execution: "worker"` must appear here
 * (enforced by a test).
 */
export const workerSimulations: Record<string, Simulation<unknown, unknown>> = {
  percolation: percolationSimulation as Simulation<unknown, unknown>,
  "ising-model": isingSimulation as Simulation<unknown, unknown>,
  "potts-model": pottsSimulation as Simulation<unknown, unknown>,
};
