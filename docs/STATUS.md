# Status

**Last updated:** 2026-10-08
**Phase:** Milestone 3 (Prove the extension points) in progress.
See [ROADMAP.md](ROADMAP.md).

## Summary

The scaffold and development infrastructure are on `main`. The generic visualization host, the
four architecture layers and three visualizations (2D random walk on the main thread, site
percolation in a Web Worker, and the Lorenz attractor in Three.js) work in the production build, and CI runs the full check on every push and PR. The GitHub repository is public, and the site
is live at https://mathvisualizer.org, deployed by Cloudflare Workers Builds on every merge to
`main`.

## Health

| Check                    | State                                                   |
| ------------------------ | ------------------------------------------------------- |
| `npm run check` (local)  | Passing: lint, typecheck, 61 tests, build               |
| CI (GitHub Actions)      | Passing on `main`; required on PRs by branch protection |
| Deployment               | Live at https://mathvisualizer.org (Workers Builds)     |
| Open capture-log entries | See [ISSUES.md](ISSUES.md)                              |

## What works

- Routes: `/`, `/about`, `/visualizations/[slug]` (static export, one HTML file per route).
- Visualization registry with validation; generic host page; schema-generated controls.
- URL state: params and seed in the query string, debounced `replaceState`.
- Seeded PRNG (sfc32) with pinned reference outputs.
- Fixed-step simulation loop outside React; zero DOM mutations while animating (verified in a
  headless browser).
- PixiJS engine host; Three.js engine host with drag-to-rotate camera (Lorenz attractor).
- Main-thread and Web Worker runners. Site percolation runs in the worker in production; a worker
  failure stops the run and shows a message in the viewport instead of freezing it.
- Render quality: Auto / Low / Medium / High, with auto step-down on slow frames.
- MDX explanations rendered at build time.
- Light/dark theme, keyboard-accessible controls, reduced-motion start-paused, mobile bottom
  sheet, no horizontal scroll at 390px.

- Development docs (`docs/`), changelog, `CLAUDE.md` agent workflow, and GitHub Actions CI.

## In progress

- Milestone 3: the Lorenz attractor (first Three.js visualization) is in review. With it, the
  milestone's exit criterion (Pixi, Three and worker execution covered) is met.

## Next up

1. Boolean and enum parameter types.
2. Home page filtering by category, difficulty and tag.
3. A visualization that needs the worker for speed (e.g. an Ising model).

## Known limitations

Tracked in more detail in [ISSUES.md](ISSUES.md).

- Random-walk trails reset when the viewport resizes or quality changes.
- At high speeds the random walk and Lorenz trails join positions sampled once per frame, not
  every step (by design; documented in their explanations).
- The 3D camera can't be moved with the keyboard yet (ISS-012).
- Bit-for-bit reproducibility is guaranteed within one JavaScript engine; across browsers,
  `Math.cos`/`Math.sin` may differ in the last bit.
- The canvas has a label but no screen-reader description of its state.
