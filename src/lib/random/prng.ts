/**
 * Seeded pseudo-random number generation for simulations.
 *
 * Simulations must never call `Math.random()`; they draw from an `Rng` created
 * from the user-visible seed so that the same seed + params reproduce the same
 * run. The generator state is a plain `Uint32Array`, so it can live inside
 * simulation state and be structured-cloned to/from a Web Worker.
 *
 * Algorithm: sfc32 ("Small Fast Counting", Chris Doty-Humphrey, from the
 * PractRand suite), seeded via splitmix32. Not cryptographically secure.
 */

export const MAX_SEED = 0xffffffff;

export interface Rng {
  /** sfc32 state words a, b, c, d. */
  readonly s: Uint32Array;
}

function splitmix32(state: { x: number }): number {
  state.x = (state.x + 0x9e3779b9) | 0;
  let t = state.x ^ (state.x >>> 16);
  t = Math.imul(t, 0x21f0aaad);
  t ^= t >>> 15;
  t = Math.imul(t, 0x735a2d97);
  t ^= t >>> 15;
  return t >>> 0;
}

/** Create a generator from a 32-bit unsigned integer seed. */
export function createRng(seed: number): Rng {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new RangeError(`Seed must be an integer in [0, ${MAX_SEED}], got ${seed}`);
  }
  const mix = { x: seed };
  const rng: Rng = {
    s: Uint32Array.of(splitmix32(mix), splitmix32(mix), splitmix32(mix), splitmix32(mix)),
  };
  // Discard early outputs so nearby seeds diverge immediately.
  for (let i = 0; i < 12; i++) nextUint32(rng);
  return rng;
}

/** Next uniformly distributed integer in [0, 2^32). */
export function nextUint32(rng: Rng): number {
  const s = rng.s;
  const t = (((s[0] + s[1]) | 0) + s[3]) | 0;
  s[3] = s[3] + 1;
  s[0] = s[1] ^ (s[1] >>> 9);
  s[1] = s[2] + (s[2] << 3);
  s[2] = (s[2] << 21) | (s[2] >>> 11);
  s[2] = s[2] + t;
  return t >>> 0;
}

/** Next float in [0, 1). */
export function nextFloat(rng: Rng): number {
  return nextUint32(rng) / 0x100000000;
}

/** Next integer in [0, maxExclusive). */
export function nextInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(nextFloat(rng) * maxExclusive);
}

/**
 * A fresh seed for the UI layer ("randomize" button, first visit without a
 * seed in the URL). Never call this from simulation code.
 */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
