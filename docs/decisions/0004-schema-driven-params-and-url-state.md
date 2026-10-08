# 0004: Schema-driven params, controls and URL state

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Each visualization needs typed parameters, UI controls and a shareable URL. The original plan had
a hand-written `controls.tsx` per visualization.

## Decision

Each visualization declares a `ParamSchema` in `params.ts` (label, min, max, step, default,
optional unit, description and `live`). From it:

- `ParamValues<typeof schema>` gives the typed params passed to the simulation;
- `ParamControls` generates labeled, accessible sliders;
- `parseParams` / `serializeParams` read and write the query string, clamping and snapping
  values, with `seed` as a reserved key;
- `live: true` params apply to the running simulation; others restart it from the seed.

`useVisualizationUrlState` keeps React state as the source of truth and mirrors it to the URL
with a debounced `history.replaceState`. Every param is serialized, not only non-defaults.
Render quality is per-device and not in the URL.

## Alternatives considered

- **Per-visualization `controls.tsx`:** more flexible, but duplicates URL and labeling logic and
  makes simple contributions harder.
- **Omitting defaults from URLs:** shorter links, but a link's meaning would change if a
  default changed.
- **`router.replace` for URL updates:** triggers Next.js navigation work on every slider move.

## Consequences

- A simple visualization needs no React code at all.
- Only numeric params exist today. Boolean/enum types and an optional custom-controls escape
  hatch are on the roadmap (Milestone 3).
- Browser back/forward does not re-sync state from the URL. Acceptable since we use
  `replaceState` only.
