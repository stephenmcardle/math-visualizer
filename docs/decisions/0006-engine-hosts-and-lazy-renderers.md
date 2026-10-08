# 0006: Engine hosts and lazily loaded renderers

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

PixiJS is the default 2D engine; Three.js must be available for genuinely 3D visualizations.
Engines must not be re-instantiated on React re-renders, and pages should not download engines
they don't use.

## Decision

- A visualization's renderer implements `reset`, `render`, `resize` and `destroy`, and is
  created by a factory that receives the engine objects (`PIXI.Application`, or Three's renderer,
  scene and camera).
- `pixi-host.ts` and `three-host.ts` own engine lifecycle: canvas creation, resolution and
  device pixel ratio, resizing and disposal. The Pixi ticker is disabled; the viewport's
  `requestAnimationFrame` loop decides when to render, and stops entirely when paused.
- Definitions declare `renderer: { engine, load: () => import("./renderer") }`. The viewport
  dynamically imports the matching host and the renderer, so each page loads only its engine.
- The engine is created once per visualization in a `useEffect` keyed on the definition, with
  a disposed flag that makes async setup safe under React StrictMode double-mounting.
- Quality levels cap renderer resolution and expose `quality.level` so renderers can drop
  detail. Quality never affects simulation results.

## Alternatives considered

- **`@pixi/react`:** declarative, but puts scene updates on React's render path, which conflicts
  with keeping per-frame work out of React.
- **A single engine-agnostic renderer interface over both engines:** would leak lowest-common-
  denominator abstractions; each renderer uses its engine directly instead.

## Consequences

- Adding a 3D visualization requires only a Three renderer factory; the host already exists but
  is unexercised until then.
- Renderers may hold visual-only memory (e.g. accumulated trails) but must never mutate
  simulation state.
