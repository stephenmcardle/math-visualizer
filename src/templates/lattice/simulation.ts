import { createRng, nextInt, type Rng } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";

/**
 * The lattice Markov chain template (ADR 0014): a `side` × `side` grid that
 * wraps around at the edges (a torus), updated one attempt at a time. One step
 * is one sweep: `side²` attempts, each at a uniformly random site. A model
 * supplies what a site holds and what one attempt does.
 */
export interface LatticeBase {
  side: number;
  rng: Rng;
  sweeps: number;
}

/** The template's fields plus the model's. Plain data, so it can cross to the worker. */
export type LatticeState<M> = LatticeBase & M;

export interface LatticeModel<P extends { side: number }, M> {
  /** The model's fields for a fresh run. Draw randomness only from `rng`. */
  init(side: number, params: P, rng: Rng): M;
  /** Runs before every sweep, to apply live params such as temperature. */
  prepare?(state: LatticeState<M>, params: P): void;
  /**
   * One update attempt at `site`, given its four neighbors on the torus (row-major
   * indices). Any further randomness comes from `state.rng`.
   */
  attempt(
    state: LatticeState<M>,
    site: number,
    north: number,
    south: number,
    west: number,
    east: number,
  ): void;
}

export function latticeSimulation<P extends { side: number }, M>(
  model: LatticeModel<P, M>,
): Simulation<P, LatticeState<M>> {
  return {
    create(params, seed) {
      const rng = createRng(seed);
      return { side: params.side, rng, sweeps: 0, ...model.init(params.side, params, rng) };
    },

    step(state, params) {
      model.prepare?.(state, params);
      const { side, rng } = state;
      const n = side * side;
      for (let attempt = 0; attempt < n; attempt++) {
        const site = nextInt(rng, n);
        const col = site % side;
        // Neighbors are computed here, inline, because this loop runs up to 512² times a
        // sweep: calling a helper per neighbor made the Ising model about 40% slower.
        model.attempt(
          state,
          site,
          site < side ? site + n - side : site - side,
          site >= n - side ? site - n + side : site + side,
          col === 0 ? site + side - 1 : site - 1,
          col === side - 1 ? site - side + 1 : site + 1,
        );
      }
      state.sweeps++;
    },
  };
}
