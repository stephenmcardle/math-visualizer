# Status

**Last updated:** 2026-10-08
**Phase:** Milestone 3 (Prove the extension points) in progress.
See [ROADMAP.md](ROADMAP.md).

## Summary

The scaffold and development infrastructure are on `main`. The generic visualization host, the
four architecture layers and two visualizations (2D random walk on the main thread, site
percolation in a Web Worker) work in the production build, and CI runs the full check on every push and PR. The GitHub repository is public, and the site
is live at https://mathvisualizer.org, deployed by Cloudflare Workers Builds on every merge to
`main`.

## Health

| Check                    | State                                                   |
| ------------------------ | ------------------------------------------------------- |
| `npm run check` (local)  | Passing: lint, typecheck, 54 tests, build               |
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
- PixiJS engine host; Three.js engine host (unused so far).
- Main-thread and Web Worker runners. Site percolation runs in the worker in production; a worker
  failure stops the run and shows a message in the viewport instead of freezing it.
- Render quality: Auto / Low / Medium / High, with auto step-down on slow frames.
- MDX explanations rendered at build time.
- Light/dark theme, keyboard-accessible controls, reduced-motion start-paused, mobile bottom
  sheet, no horizontal scroll at 390px.

- Development docs (`docs/`), changelog, `CLAUDE.md` agent workflow, and GitHub Actions CI.

## In progress

- Milestone 3: site percolation (second 2D visualization, first worker-executed one) is in
  review.

## Next up

1. A first Three.js visualization.
2. Boolean and enum parameter types.
3. A visualization that needs the worker for speed (e.g. an Ising model).

## Known limitations

Tracked in more detail in [ISSUES.md](ISSUES.md).

- Random-walk trails reset when the viewport resizes or quality changes.
- At high speeds the random walk draws positions sampled once per frame, not every step
  (by design; documented in its explanation).
- Bit-for-bit reproducibility is guaranteed within one JavaScript engine; across browsers,
  `Math.cos`/`Math.sin` may differ in the last bit.
- The canvas has a label but no screen-reader description of its state.
