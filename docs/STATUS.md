# Status

**Last updated:** 2026-10-12
**Phase:** Milestone 4 (Polish and reach) in progress.
See [ROADMAP.md](ROADMAP.md).

## Summary

The scaffold and development infrastructure are on `main`. The generic visualization host, the
four architecture layers and four visualizations (2D random walk on the main thread, site
percolation and the Ising model in a Web Worker, and the Lorenz attractor in Three.js) work in the production build, and CI runs the full check on every push and PR. The GitHub repository is public, and the site
is live at https://mathvisualizer.org, deployed by Cloudflare Workers Builds on every merge to
`main`.

## Health

| Check                    | State                                                   |
| ------------------------ | ------------------------------------------------------- |
| `npm run check` (local)  | Passing: lint, typecheck, 94 tests, build               |
| CI (GitHub Actions)      | Passing on `main`; required on PRs by branch protection |
| Deployment               | Live at https://mathvisualizer.org (Workers Builds)     |
| `npm run test:e2e`       | Passing: 13 Playwright smoke tests (also in CI)         |
| Open capture-log entries | See [ISSUES.md](ISSUES.md)                              |

## What works

- Routes: `/`, `/about`, `/visualizations/[slug]` (static export, one HTML file per route).
- Visualization registry with validation; generic host page; schema-generated controls for
  number, boolean and enum params.
- URL state: params and seed in the query string, debounced `replaceState`.
- Seeded PRNG (sfc32) with pinned reference outputs.
- Fixed-step simulation loop outside React; zero DOM mutations while animating (verified in a
  headless browser).
- PixiJS engine host; Three.js engine host with drag-to-rotate camera (Lorenz attractor).
- Main-thread and Web Worker runners. Site percolation and the Ising model run in the worker in production; a worker
  failure stops the run and shows a message in the viewport instead of freezing it.
- Copy link (current params and seed) and save the current frame as a PNG.
- Render quality: Auto / Low / Medium / High, with auto step-down on slow frames.
- MDX explanations rendered at build time, with KaTeX math.
- Screen-reader state descriptions (on pause) and an arrow-key 3D camera.
- Light/dark theme, keyboard-accessible controls, reduced-motion start-paused, mobile bottom
  sheet, no horizontal scroll at 390px.

- Development docs (`docs/`), changelog, `CLAUDE.md` agent workflow, and GitHub Actions CI with
  end-to-end smoke tests.

## In progress

- Milestone 4: KaTeX math in explanations is in review. Copy link, Save image, end-to-end smoke
  tests, screen-reader descriptions and the keyboard 3D camera shipped; Milestone 3 closed
  2026-10-12.

## Next up

1. Auto quality that can step back up (ISS-009).
2. Home page filtering, then pan and zoom.

## Known limitations

Tracked in more detail in [ISSUES.md](ISSUES.md).

- Random-walk trails reset when the viewport resizes or quality changes.
- At high speeds the random walk and Lorenz trails join positions sampled once per frame, not
  every step (by design; documented in their explanations).
- Bit-for-bit reproducibility is guaranteed within one JavaScript engine; across browsers,
  `Math.cos`/`Math.sin` may differ in the last bit.
- Screen-reader descriptions update only while paused; while playing they say so.
