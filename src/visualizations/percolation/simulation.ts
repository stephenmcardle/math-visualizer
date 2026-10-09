import { createRng, nextInt, type Rng } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";
import type { PercolationParams } from "@/visualizations/percolation/params";

/** `edges` bits: the cluster touches the top row / the bottom row. */
export const TOUCHES_TOP = 1;
export const TOUCHES_BOTTOM = 2;
export const SPANS = TOUCHES_TOP | TOUCHES_BOTTOM;

/**
 * Site percolation on a `side` × `side` square lattice, swept with the
 * Newman–Ziff algorithm: sites open one per step in a uniformly random order,
 * so after `opened` steps the occupation probability is p = opened / side².
 *
 * Clusters (4-neighbor connected open sites) are tracked incrementally. Each
 * cluster is a linked list of its sites, identified by its head site; merging
 * relabels the smaller list into the larger, so every open site's cluster is a
 * direct lookup in `label` and a whole sweep costs O(n log n).
 */
export interface PercolationState {
  side: number;
  /** Sites opened so far; also the number of steps taken. */
  opened: number;
  rng: Rng;
  /** A permutation of site indices; `order[0..opened)` are open, in opening order. */
  order: Int32Array;
  /** Cluster id (its head site) for each site, or -1 while the site is closed. */
  label: Int32Array;
  /** Next site in the same cluster's list, or -1. */
  next: Int32Array;
  /** Indexed by cluster id: last site of the cluster's list. */
  tail: Int32Array;
  /** Indexed by cluster id: number of sites in the cluster. */
  size: Int32Array;
  /** Indexed by cluster id: `TOUCHES_TOP` / `TOUCHES_BOTTOM` bits. */
  edges: Uint8Array;
  /** Value of `opened` when a cluster first spanned top to bottom, or -1. */
  spanningAt: number;
}

function merge(state: PercolationState, a: number, b: number): number {
  const { label, next, tail, size, edges } = state;
  const [big, small] = size[a] >= size[b] ? [a, b] : [b, a];
  for (let site = small; site !== -1; site = next[site]) label[site] = big;
  next[tail[big]] = small;
  tail[big] = tail[small];
  size[big] += size[small];
  edges[big] |= edges[small];
  return big;
}

export const percolationSimulation: Simulation<PercolationParams, PercolationState> = {
  create(params, seed) {
    const n = params.side * params.side;
    const order = new Int32Array(n);
    for (let i = 0; i < n; i++) order[i] = i;
    return {
      side: params.side,
      opened: 0,
      rng: createRng(seed),
      order,
      label: new Int32Array(n).fill(-1),
      next: new Int32Array(n).fill(-1),
      tail: new Int32Array(n),
      size: new Int32Array(n),
      edges: new Uint8Array(n),
      spanningAt: -1,
    };
  },

  step(state) {
    const { side, order, label } = state;
    const n = side * side;
    if (state.opened === n) return;

    // Lazy Fisher–Yates: pick the next site uniformly from the closed ones.
    const pick = state.opened + nextInt(state.rng, n - state.opened);
    const site = order[pick];
    order[pick] = order[state.opened];
    order[state.opened] = site;
    state.opened++;

    const row = Math.floor(site / side);
    const col = site - row * side;
    label[site] = site;
    state.tail[site] = site;
    state.size[site] = 1;
    state.edges[site] = (row === 0 ? TOUCHES_TOP : 0) | (row === side - 1 ? TOUCHES_BOTTOM : 0);

    let cluster = site;
    const join = (neighbor: number) => {
      const other = label[neighbor];
      if (other !== -1 && other !== cluster) cluster = merge(state, cluster, other);
    };
    if (row > 0) join(site - side);
    if (row < side - 1) join(site + side);
    if (col > 0) join(site - 1);
    if (col < side - 1) join(site + 1);

    if (state.spanningAt === -1 && state.edges[cluster] === SPANS) state.spanningAt = state.opened;
  },
};
