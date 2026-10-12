# 0013: Shared color palettes as a live param

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

Each renderer hard-coded its colors: golden-angle hues for walkers, clusters and trajectories,
and orange/blue for Ising spins. Viewers should be able to switch palettes, for taste, color
blindness or print, on every visualization and without restarting the run.

## Decision

- `src/lib/rendering/palettes.ts` defines seven palettes: Classic (the previous colors, so old
  links look the same), Okabe–Ito, Viridis, Plasma, Cividis, Turbo and Grayscale. Each gives
  `colors(count)`, distinct colors for many things, and `pair`, two contrasting colors for
  two-state pictures. Continuous colormaps are sampled along a golden-ratio sequence, so early
  indices are far apart, and trimmed at ends that vanish against a light or dark background.
- Every visualization includes the shared enum param `palette: paletteParam` (`live: true`), so
  the choice is a select in the controls, stored in the URL, and kept by **Copy link**, like any
  other param (ADR 0004, 0009). A test checks every registered visualization has it.
- Renderers read `palette(params.palette)` and, when it changes in `render`, recolor what is on
  screen without a reset: lattices repaint their pixel buffers, and the Lorenz renderer rewrites
  its tint buffers, including drawn trails. Random-walk trails are pixels that can't be
  recolored, so they are cleared; the walkers carry on.
- Ramp colors are samples of d3-scale-chromatic 3.1.0 (ISC), taken once and stored as data
  instead of adding a runtime dependency.

## Alternatives considered

- **A site-wide preference (like the theme):** one choice everywhere, but not in shared links,
  and it needs a new host-level setting outside the param schema.
- **Per-visualization palettes:** each could pick colors that suit it, but the same names would
  mean different things on different pages.
- **Restarting on palette change:** simpler renderers, but losing a long run to change colors
  is a poor trade.

## Consequences

- A new visualization adds `palette: paletteParam` and takes its colors from `palette(...)`.
- The palette param appears in every URL. Old links without it get Classic.
- Adding a palette is a data change in one file; removing one would change old links that name
  it to Classic, so treat option values as stable.
