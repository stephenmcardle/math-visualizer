# Status

**Last updated:** 2026-10-13
**Phase:** Milestones 0–4 complete; Milestone 5 (templates and openai/math models) in progress.
See [ROADMAP.md](ROADMAP.md).

## Summary

The scaffold and development infrastructure are on `main`. The generic visualization host, the
four architecture layers and nine visualizations (2D random walk on the main thread, site
percolation and the Ising, Potts, random-bond Ising, Ashkin–Teller, XY and O(3) models in a Web Worker, and the Lorenz attractor in Three.js) work in the production build, and CI runs the full check on every push and PR. The GitHub repository is public, and the site
is live at https://mathvisualizer.org, deployed by Cloudflare Workers Builds on every merge to
`main`.

## Health

| Check                    | State                                                   |
| ------------------------ | ------------------------------------------------------- |
| `npm run check` (local)  | Passing: lint, typecheck, 198 tests, build              |
| CI (GitHub Actions)      | Passing on `main`; required on PRs by branch protection |
| Deployment               | Live at https://mathvisualizer.org (Workers Builds)     |
| `npm run test:e2e`       | Passing: 27 Playwright smoke tests (also in CI)         |
| Open capture-log entries | See [ISSUES.md](ISSUES.md)                              |

## What works

- A model switcher on pages in the same family (Ising, Potts, random-bond Ising, Ashkin–Teller, XY and O(3) are "Lattice spin models"),
  which keeps the seed and shared settings when switching.
- Seven color palettes on every visualization, switchable mid-run and stored in the URL.
- Pan and zoom on the 2D visualizations (mouse, touch, keyboard and buttons); one-finger swipes
  and plain scrolling still scroll the page.
- Home page filters (category, difficulty, tag) stored in the URL.
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
- Render quality: Auto / Low / Medium / High; auto steps down on slow frames and back up after
  sustained fast ones.
- MDX explanations rendered at build time, with KaTeX math.
- Screen-reader state descriptions (on pause) and an arrow-key 3D camera.
- Light/dark theme, keyboard-accessible controls, reduced-motion start-paused, mobile bottom
  sheet, no horizontal scroll at 390px.

- Development docs (`docs/`), changelog, `CLAUDE.md` agent workflow, and GitHub Actions CI with
  end-to-end smoke tests.

## In progress

- Milestone 5, visualization templates ([design](plans/2026-10-12-template-system-design.md)).
  [Plan 1](plans/2026-10-12-lattice-template.md) is implemented: the lattice template with
  Ising ported, the Potts model, and model families with a switcher (ADR 0014).
  [Plan 2](plans/2026-10-12-lattice-models.md) is implemented: random-bond Ising, Ashkin–Teller,
  XY and O(3), with deterministic trigonometry and an Ising cross-check (ADR 0015).
  Plan 3 (planar-particle template) next.

## Next up

1. Write Plan 3 (planar-particle template).
2. Watch CI after `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19 (ISS-010).

## Known limitations

Tracked in more detail in [ISSUES.md](ISSUES.md).

- Random-walk trails reset when the viewport resizes or quality changes.
- At high speeds the random walk and Lorenz trails join positions sampled once per frame, not
  every step (by design; documented in their explanations).
- Bit-for-bit reproducibility is guaranteed within one JavaScript engine; across browsers,
  `Math.cos`/`Math.sin` may differ in the last bit (the random walk's isotropic mode; the lattice
  models use deterministic math, ADR 0015).
- Screen-reader descriptions update only while paused; while playing they say so.
- Zooming into the random walk shows older trails at the resolution they were drawn at.
