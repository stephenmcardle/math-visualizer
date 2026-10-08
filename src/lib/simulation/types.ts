/**
 * The simulation contract: pure TypeScript, no React, DOM, PixiJS or Three.js.
 *
 * State should be plain data (numbers, arrays, TypedArrays, plain objects) so
 * it can be structured-cloned to and from a Web Worker without changes.
 */
export interface Simulation<TParams, TState> {
  /** Build the initial state. Same params + seed must give the same state. */
  create(params: TParams, seed: number): TState;
  /**
   * Advance exactly one discrete step, mutating `state` in place.
   *
   * Steps are fixed-size (no wall-clock `dt`), so a run is fully determined by
   * seed, params and step count regardless of frame rate. Draw all randomness
   * from an `Rng` stored in the state.
   */
  step(state: TState, params: TParams): void;
}
