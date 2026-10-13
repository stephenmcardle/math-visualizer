import type { Simulation } from "@/lib/simulation/types";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
import { o3Simulation } from "@/visualizations/o3-model/simulation";
import { percolationSimulation } from "@/visualizations/percolation/simulation";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";
import { xySimulation } from "@/visualizations/xy-model/simulation";

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
  "random-bond-ising": randomBondIsingSimulation as Simulation<unknown, unknown>,
  "ashkin-teller": ashkinTellerSimulation as Simulation<unknown, unknown>,
  "xy-model": xySimulation as Simulation<unknown, unknown>,
  "o3-model": o3Simulation as Simulation<unknown, unknown>,
};
