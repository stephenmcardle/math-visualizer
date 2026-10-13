# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
will follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once it has releases.
Until then, everything is under **Unreleased**.

Add entries in the same PR as the change, under the matching heading: Added, Changed,
Deprecated, Removed, Fixed or Security. Write for contributors and users, not as a commit log.

## [Unreleased]

### Added

- `docs/plans/2026-10-12-lattice-models.md`: Plan 2, which adds the random-bond Ising,
  Ashkin–Teller, XY and O(3) models on the lattice template, deterministic trigonometry, palette
  wheels for angles, and a cross-check that the models reducing to Ising reproduce it.
- A model switcher on pages that belong to a family, starting with **Lattice spin models**
  (Ising and Potts). Switching keeps the seed and every setting the two pages share, such as
  grid size, speed and palette.
- **Potts model** page: the q-state generalization of the Ising model, from 2 to 10 states,
  with the temperature as a multiple of the critical temperature. Up to 4 states the transition
  is continuous; above it is abrupt. The first model built on the lattice template.
- `docs/plans/`: the design for visualization templates (lattice, planar particles, lattice
  growth) and model families, and Plan 1, which moves Ising onto a lattice template and adds the
  Potts model and a model switcher.
- `docs/research/openai-math-candidates.md`: a review of all 372 result families in
  [openai/math](https://github.com/openai/math), sorted into do now (11), do later (28), maybe
  (36) and not possible (297), with the visualization templates they imply.
- A **Palette** choice on every visualization: Classic (the previous colors), Okabe–Ito
  (color-blind safe), Viridis, Plasma, Cividis, Turbo and Grayscale. Switching recolors the
  current run instead of restarting it (random-walk trails start fresh in the new colors), and
  the palette is kept in the URL and shared links (ADR 0013).
- Pan and zoom on the 2D visualizations (random walk, percolation, Ising model): drag and
  Ctrl/⌘ + scroll with a mouse, two fingers on a touchscreen, plus/minus, arrows and 0 on the
  keyboard, and **Zoom in**, **Zoom out** and **Reset view** buttons in the viewport's corner.
  A plain scroll or one-finger swipe still scrolls the page. The view isn't stored in the URL
  but is kept in saved images (ADR 0012).
- Home page filters for category, difficulty and tag, with a match count and **Clear filters**.
  Filters are kept in the URL (`/?tag=phase+transition`) so a filtered list can be shared; the
  static HTML still lists every visualization, and the controls render disabled until the page
  loads so nothing shifts.
- Math in explanations is typeset with KaTeX at build time (TeX in MDX via `remark-math` and
  `rehype-katex`), with MathML for screen readers; only the stylesheet and fonts load in the
  browser. All four explanations now use it. A test fails on invalid TeX.
- Screen-reader descriptions of each visualization's state, such as "50 walkers after 450 steps…"
  or the Ising magnetization. They are the viewport's description while paused, and pausing
  announces them (ADR 0011).
- The Lorenz camera rotates with the arrow keys once the viewport has keyboard focus. Renderers
  can now declare keyboard handling, which makes the viewport focusable.
- End-to-end smoke tests (Playwright, Chromium) against the production build, run in CI after the
  build (ADR 0010). Every registered visualization is checked for a drawn frame, a complete URL
  and a clean console; host tests cover URL state, Copy link, the phone layout and the 404 page.
- **Copy link** and **Save image** buttons on every visualization. The link is built from the
  current params and seed (not the address bar, which updates after a short delay); the image is
  the current frame as a PNG on the viewport's background color, named after the visualization
  and seed. Engine hosts expose their canvas for this.
- Ising model visualization: Metropolis sweeps of up to 512×512 spins in a Web Worker, with a
  live temperature control, random or all-up starting spins, and the magnetization per spin. It
  is the first visualization that needs the worker for speed. Flip probabilities avoid
  `Math.exp`, so shared links replay exactly in every browser.
- Boolean and enum parameters, shown as switches and selects and stored in the URL as `1`/`0` and
  option names (ADR 0009). The random walk uses them for **Step directions** (any direction or
  the four grid directions) and **Show trails**. Existing links replay unchanged.
- Lorenz attractor visualization, the first in Three.js: hundreds of seeded trajectories
  integrated with RK4 spread across the attractor, with fading trails and a drag-to-rotate
  camera. Shared links replay exactly in every browser because the integrator uses only basic
  arithmetic.
- Three.js renderers get `requestRender()` to draw a frame without stepping, for camera controls
  (ADR 0008).
- Site percolation visualization: a seeded Newman–Ziff sweep on a square lattice of up to
  512×512 sites, with cluster coloring, a highlighted spanning cluster and the p at which it
  first spans. It is the first visualization that runs its simulation in a Web Worker.
- Development docs in `docs/`: status, roadmap, capture log, and architecture decision records
  (ADRs 0001–0007).
- This changelog.
- `CLAUDE.md` with the development workflow for AI coding agents.
- GitHub Actions CI running lint, typecheck, tests, production build and format check on pushes
  and pull requests to `main`.
- Initial scaffold: Next.js 16 static-export app with a generic visualization host, simulation /
  renderer / UI / worker layers, visualization registry, schema-driven controls with shareable
  URL state, seeded sfc32 PRNG, PixiJS engine host, Three.js engine host, optional Web Worker
  execution, adaptive render quality, MDX explanations, light/dark themes, and a seeded 2D random
  walk demo.
- Vitest tests for the PRNG, random-walk determinism (including through the worker protocol),
  URL params, registry and step clock.
- README, CONTRIBUTING, Code of Conduct (Contributor Covenant 2.1), Apache-2.0 license, issue
  and pull request templates, Cloudflare `wrangler.jsonc` and cache headers.

### Changed

- The Ising model now runs on a shared lattice template (`src/templates/lattice/`), the base
  for upcoming lattice models. Shared links replay exactly as before, and a sweep is slightly
  faster.
- "Auto" render quality now steps back up after a slowdown ends: one level after a sustained run
  of fast frames, never above the device's starting level, with the wait doubling after each step
  down so it can't oscillate. Frame times are judged per 90-frame window, so occasional long
  frames don't block recovery. Previously it only ever stepped down until reload (ISS-009).
- Milestone 3 is complete. Home page filtering moved to Milestone 4, and per-visualization
  custom controls to the capture log until a visualization needs them.
- Pull requests get Cloudflare Worker Previews: `wrangler.jsonc` has the required `previews` block
  and Workers Builds runs `npx wrangler preview` for non-production branches.
- The site is live at https://mathvisualizer.org, deployed by Cloudflare Workers Builds on every
  merge to `main`. The README has a screenshot, the demo link and the Workers Builds settings.
- The repository is public, and `main` is protected: changes need a pull request with a passing,
  up-to-date CI `check`, for admins too.
- The Code of Conduct now links a private reporting form instead of a placeholder contact.
- All changes now go through pull requests that must pass CI. CONTRIBUTING and `CLAUDE.md`
  document the PR workflow.
- `CLAUDE.md` now explains how a visualization runs end to end (build-time page, URL-backed
  configuration, the frame loop and its restart/redraw/resize controls), single-test commands,
  and Base UI / Turbopack / static-export gotchas.

### Fixed

- Swiping over a 2D visualization on a touchscreen now scrolls the page. Pixi's event system had
  set `touch-action: none` on the canvas, trapping the swipe in a viewport that fills most of a
  phone screen.
- A worker that can't keep up no longer falls further behind with every batch: a batch of steps
  is never larger than the one in flight, so the simulation slows down instead.

- A failing simulation worker now stops the run and shows a message in the viewport, instead of
  leaving the canvas frozen with only a console error.

[Unreleased]: https://github.com/stephenmcardle/math-visualizer/commits/main
