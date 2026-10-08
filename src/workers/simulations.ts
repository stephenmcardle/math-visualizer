import type { Simulation } from "@/lib/simulation/types";
import { randomWalkSimulation } from "@/visualizations/random-walk/simulation";

/**
 * Simulations the worker can run, by slug. Kept separate from the main
 * registry so the worker bundle contains only pure simulation code, never
 * renderers or MDX. A definition with `execution: "worker"` must appear here
 * (enforced by a test). The random walk runs on the main thread but is listed
 * so the worker path is exercised by tests.
 */
export const workerSimulations: Record<string, Simulation<unknown, unknown>> = {
  "random-walk": randomWalkSimulation as Simulation<unknown, unknown>,
};
