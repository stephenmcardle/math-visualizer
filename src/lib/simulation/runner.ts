import type { Simulation } from "@/lib/simulation/types";

export interface Snapshot<TState> {
  state: TState;
  /** Increments on every reset, so renderers can tell a new run from a continued one. */
  generation: number;
}

/**
 * Owns simulation state on behalf of the viewport. Implementations run the
 * simulation on the main thread or in a Web Worker; the viewport loop does
 * not need to know which.
 */
export interface SimulationRunner<TParams, TState> {
  reset(params: TParams, seed: number): void;
  advance(params: TParams, steps: number): void;
  /** Latest available state, or `null` before the first reset completes. */
  current(): Snapshot<TState> | null;
  dispose(): void;
}

export class LocalSimulationRunner<TParams, TState> implements SimulationRunner<TParams, TState> {
  private snapshot: Snapshot<TState> | null = null;
  private generation = 0;

  constructor(private readonly simulation: Simulation<TParams, TState>) {}

  reset(params: TParams, seed: number): void {
    this.generation++;
    this.snapshot = { state: this.simulation.create(params, seed), generation: this.generation };
  }

  advance(params: TParams, steps: number): void {
    if (!this.snapshot) return;
    for (let i = 0; i < steps; i++) this.simulation.step(this.snapshot.state, params);
  }

  current(): Snapshot<TState> | null {
    return this.snapshot;
  }

  dispose(): void {
    this.snapshot = null;
  }
}
