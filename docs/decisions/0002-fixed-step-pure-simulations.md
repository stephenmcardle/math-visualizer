# 0002: Fixed-step, pure, plain-data simulations

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Runs must be reproducible from seed and parameters, independent of the rendering engine, and
movable into a Web Worker. The suggested interface was `step(state, params, dt): TState`.

## Decision

```ts
interface Simulation<TParams, TState> {
  create(params: TParams, seed: number): TState;
  step(state: TState, params: TParams): void; // one fixed step, mutates in place
}
```

- No wall-clock `dt`. The viewport's `StepClock` turns elapsed time into a whole number of steps;
  each visualization declares `stepsPerSecond(params)`.
- `step` mutates state in place instead of returning a new object, to avoid per-step allocation.
- State is plain data (numbers, TypedArrays, plain objects), including the RNG state.
- Simulation files must not import React, the DOM, PixiJS or Three.js. ESLint bans `Math.random`
  in simulation code.

## Alternatives considered

- **`step(state, params, dt)`:** frame-rate dependent, so the same seed gives different runs on
  different devices.
- **Immutable state (return a new state):** cleaner semantics, but allocates every step, which
  is expensive for large TypedArray state.

## Consequences

- A run is fully determined by (seed, params, step count); tests can assert exact equality.
- Continuous-time systems must pick a fixed internal time step and expose speed separately.
- Renderers see state at most once per frame, so several steps can happen between draws.
- Cross-engine bit-exactness is not guaranteed for `Math.*` functions (see ISSUES ISS-005).
