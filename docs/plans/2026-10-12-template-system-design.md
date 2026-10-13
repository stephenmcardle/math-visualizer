# Visualization templates: design

- **Status:** Accepted; Plans 1–2 done
- **Date:** 2026-10-12
- **Inputs:** [openai/math review](../research/openai-math-candidates.md), including its
  "Decisions for the template plan" section

## Goal

Add the 11 "do now" models from the openai/math review without writing 11 simulations and
renderers from scratch. Models that share a structure share code (a **template**), while each
model keeps its own page, URL, explanation and params, as decided after the review.

## Terms

- **Template:** code shared by every model with the same structure: the simulation loop, the
  shared params, the renderer and a definition helper. It lives in `src/templates/<name>/`.
- **Model:** one page built from a template. It supplies only what differs: its fields, its
  update rule, its colors and overlay text, its params, metadata and explanation. It lives in
  `src/visualizations/<slug>/` like any other visualization and is registered the same way.
- **Family:** pages that are variations on one idea, such as "Lattice spin models". A family is
  a label in each page's metadata. Pages in the same family link to each other through a
  **model switcher**. A family usually matches a template, but not always: the random walk in a
  random environment belongs with the random walk, while the standard map, on the same
  template, belongs with neither.

## How a template is built

Every template follows the same five-part pattern, so the existing layer contracts (ADR 0002,
0005, 0006) stay unchanged and the host, viewport, runners and worker need no changes:

| Part               | Where                  | What it gives a model                                                         |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------- |
| Params helper      | `params.ts`            | The shared params (size, speed, palette) around the model's own params        |
| Simulation factory | `simulation.ts`        | `Simulation<P, State>` from a small model object; owns the loop and the RNG   |
| Painter interface  | `painter.ts` (no Pixi) | The hooks a model fills in to color its state and label the overlay           |
| Renderer factory   | `renderer.ts` (Pixi)   | A full renderer with pan and zoom, palettes and the overlay label             |
| Definition helper  | `definition.ts`        | Fixes engine, execution and steps per second, so a model can't get them wrong |

The worker bundle must contain no renderer code (ADR 0005), so a model splits the same way:
its `simulation.ts` uses only the simulation factory, and its `renderer.ts` is a one-line call to
the renderer factory with its painter.

Templates must not slow models down. The lattice prototype first called a neighbor helper four
times per update attempt, which made Ising 40% slower; computing the neighbors once in the
template's loop and passing them to the model made it faster than today's Ising
(8.4 ms against 10.2 ms per 512² sweep in Node).

## Model families and the switcher

- `VisualizationMetadata` gains an optional `family` label. Pages with the same label form a
  family, in registry order.
- When a page's family has at least two members, the host shows a row of links above the
  viewport, with the current model marked. Each link points at the sibling page with this run's
  params and seed in the query string. The target keeps the keys it shares, ignores the rest
  and falls back to defaults for invalid values, which `parseParams` already does.
- Shared keys must mean the same thing on every page of a family. A test checks that a key
  shared within a family has the same type and the same range or options. A model whose
  parameter differs gets a different key: Potts uses `relativeTemperature`, a multiple of its
  critical temperature, rather than Ising's absolute `temperature`.
- The page keys the host by slug, so a switch always builds a fresh host, runner and worker.

## Templates

### T1 lattice Markov chain (first)

A `side` × `side` torus updated by single-site attempts. One step is one sweep of `side²`
attempts at uniformly random sites. The template draws the site with `nextInt(rng, n)`, exactly
as Ising does now, so old Ising links replay unchanged; Ising's pinned test must pass without
edits to its expected values.

- **Model hooks:** `init(side, params, rng)` returns the model's fields;
  `prepare(state, params)` runs before each sweep for live params; and
  `attempt(state, site, north, south, west, east)` performs one update.
- **Painter hooks:** `colors(palette, state)` returns the colors in use, `paint(state, pixels,
table)` writes one pixel per site, and `label(state, params)` returns the overlay text. The
  renderer rebuilds its color table on every reset and every palette change, so a model whose
  colors depend on a non-live param, such as Potts's q, always has the right number.
- **Shared params:** `side` (32–512), `speed` (sweeps per second) and `palette`.
- **Models, in order:**
  1. Ising, ported.
  2. Potts (223).
  3. Random-bond Ising (218).
  4. Ashkin–Teller (233).
  5. XY (216).
  6. O(3) (215).
- **Later needs:**
  - XY and O(3) need deterministic `sin` and `cos` in `src/lib/math/deterministic.ts`
    (ISS-005).
  - XY needs a cyclic color table.
  - Directions are quantized to 1/65536 turn instead (ADR 0015), so XY and O(3) keep the shared
    grid size.

### T3 planar particles (second)

Many particles in the plane, each moved by the model every step; the random walk is the first
port and must keep its pinned replay.

- **Expected hooks:** `init` for positions and model fields, and `move(state, i)` per
  particle.
- **Renderer:** the random walk's trail texture, rebaked on pan and zoom.
- **Models:**
  - Random walk in a random environment (220).
  - Steinitz vector balancing (097).
  - Quintic Liénard system (143).
  - Standard map (146).
- **Open points for its plan:**
  - Orbits of the standard map are dots on a torus, not trails, so the renderer needs a
    "points" mode and wrapping.
  - The random walk's isotropic mode uses `Math.cos` and `Math.sin`. Changing that would change
    old links, so it stays as is, and the template must allow it.

### T2 lattice growth (third)

A lattice whose sites join clusters or a growing set over time; percolation is the first
port.

- **Expected hooks:** pick the next site and merge it into clusters with union-find.
- **Renderer:** percolation's cluster coloring.
- **Models:**
  - First-passage percolation (212): Eden-type growth, with Dijkstra in the worker.
  - Gaussian moat (028): Gaussian primes joined within a step size.

## Rollout

Each step is its own plan and PR, written after the previous one merges, so it can use what
the previous one taught:

1. **Plan 1:** the T1 template, Ising ported, Potts, model families and the switcher. See
   [Plan 1](2026-10-12-lattice-template.md).
2. **Plan 2:** the remaining T1 models: random-bond Ising, Ashkin–Teller, XY and O(3), with
   deterministic trigonometry.
3. **Plan 3:** the T3 template, the random walk ported, and its four models.
4. **Plan 4:** the T2 template, percolation ported, and its two models.

## Rules for every model

- It replays exactly from its link: a pinned replay test, deterministic math only, and
  randomness only from the state's `Rng`.
- Its explanation cites refereed sources for the model. It cites its openai/math manuscript
  as an unrefereed 2026 manuscript, says whether the main result is Lean-formalized, and says
  what the page shows when that differs from what the manuscript proves.
- It joins a family only where switching makes sense to a reader.

## Not in scope

- Templates T4 to T13 from the review.
- One page hosting several models.
- Folding variants into existing pages, such as random-bond Ising as an Ising param.
