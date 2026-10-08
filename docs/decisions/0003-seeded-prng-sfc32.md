# 0003: sfc32 PRNG seeded via splitmix32

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Simulations need a fast, seedable generator whose state can live in simulation state and be
cloned to a worker. The seed is user-visible and goes in the URL.

## Decision

`src/lib/random/prng.ts` implements sfc32 (Chris Doty-Humphrey, PractRand) with 128-bit state in
a `Uint32Array(4)`, seeded from a 32-bit unsigned seed via splitmix32, discarding the first 12
outputs. Seeds are integers in `[0, 2^32 − 1]`. Tests pin the first outputs for two seeds,
cross-checked against the reference JavaScript formulation.

## Alternatives considered

- **mulberry32:** smaller, but its 2^32 period could be exhausted within hours by a
  visualization drawing hundreds of thousands of numbers per second.
- **A library (e.g. seedrandom):** an extra dependency for about 40 lines of code.
- **Crypto RNG:** not seedable.

## Consequences

- Changing the algorithm, seeding or warm-up changes every shared URL's run. The pinned-output
  test fails deliberately in that case; treat it as a breaking change.
- Not cryptographically secure; must never be used for security purposes.
