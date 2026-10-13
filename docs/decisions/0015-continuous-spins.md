# 0015: Continuous spins: quantized angles, deterministic trigonometry and palette wheels

- **Status:** Accepted
- **Date:** 2026-10-13

## Context

The XY and O(3) models need spins that point in any direction. Two problems come with that:

- **Determinism:** `Math.sin` and `Math.cos` may round differently between browsers (ISS-005),
  which would break exact replay of shared links.
- **Snapshot size:** 512² floating-point spins make a several-megabyte worker snapshot every
  frame. The design doc proposed a smaller maximum grid for these models, but that would give
  them a different `side` range from their siblings in the family.

## Decision

- **Quantized directions.** Directions are whole steps of 1/65536 of a turn in `Uint16Array`s
  (`src/lib/math/angles.ts`); O(3) adds a height in 65536 equal-area bands.
  - Angle arithmetic is exact, with wraparound by mask.
  - Cosines and sines are table lookups.
  - XY vortices are counted exactly with integer arithmetic.
  - The state is at most 1 MB at 512², so every lattice model keeps the 32–512 grid.
- **Deterministic math.** The tables are built with `cosTurns` and `sinTurns`
  (`src/lib/math/deterministic.ts`): exact reduction of whole turns, then a Taylor series on at
  most an eighth of a turn, using only + − × ÷. `sinhPositive` and `bisect` find critical points
  the same way.
- **Palette wheels.** `Palette.wheel(count)` gives colors for angles (extending ADR 0013).
  - Classic is a hue wheel.
  - Okabe–Ito is its seven colors in sectors.
  - Ramps run out and back, so they are cyclic but don't tell the two directions of turning
    apart.
- **Label caching.** The lattice renderer rewrites its label only after a new sweep or a param
  change, so labels can afford to scan the lattice.

## Alternatives considered

- **Float64 angles with deterministic `sin`/`cos` per attempt:** about as accurate, but slower,
  and the snapshots are larger.
- **A smaller maximum grid for continuous models:** a `side` range different from the rest of
  the family, and still floating-point state.
- **A fixed hue wheel, ignoring the palette:** the palette control would do nothing on XY.

## Consequences

- 65536 directions is a clock model, not the continuum. At the energies a lattice simulation
  reaches, the difference is far below anything visible; the explanations say so.
- Future models with angles (for example the standard map, Plan 3) can reuse `cosTurns` and
  `sinTurns` or the tables.
- A palette added later must define `wheel`.
