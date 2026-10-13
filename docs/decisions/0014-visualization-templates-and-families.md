# 0014: Visualization templates and model families

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The openai/math review found 11 models we can show now. Most are variations on the Ising
model, percolation or the random walk. Writing each as a separate simulation and renderer would
repeat the same loop, lattice drawing, pan and zoom, and palette handling many times. We also
decided that each model keeps its own page, and that related pages should link to each other.

## Decision

- A **template** in `src/templates/<name>/` owns everything models of one structure share: a
  params helper, a simulation factory, a Pixi-free painter interface, a renderer factory and a
  definition helper. A model in `src/visualizations/<slug>/` supplies only its fields, its update
  rule, its painter, its params, metadata and explanation, and is registered like any other
  visualization. The first template is the lattice Markov chain (`src/templates/lattice/`), used
  by Ising and Potts.
- The simulation and renderer factories stay separate, so the worker bundle still has no
  renderer code (ADR 0005). Templates compute shared work, such as lattice neighbors, inline in
  their loops; a per-attempt helper call made Ising 40% slower.
- Ported models keep their pinned replay tests unchanged; a template must draw random numbers in
  exactly the old order.
- `VisualizationMetadata.family` groups related pages. When a family has two or more pages, the
  host shows links to them that carry the current params and seed. A key shared within a family
  must mean the same on every page; a test checks types and ranges, and a model whose parameter
  differs uses a different key.
- Deterministic replacements for `Math` functions live in `src/lib/math/deterministic.ts`.

## Alternatives considered

- **One page per template, with a model select:** fewer pages, but the param schema would
  change with the model, and models would share one explanation and one search listing.
- **Inheritance or a generic "lattice visualization" with switches:** every new model would
  add branches to shared code; the hook objects keep each model's code in its own folder.
- **No templates:** simplest per page, but repeats about 130 lines of renderer per model.

## Consequences

- A lattice model is about 8 small files, and most of the new code is the update rule.
- Template changes affect several pages at once, so their tests must cover every model, and
  ported models' pinned replays guard old links.
- Revisit if a model needs a hook the template doesn't have: extend the template, or leave that
  model on its own.
