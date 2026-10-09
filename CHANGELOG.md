# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
will follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once it has releases.
Until then, everything is under **Unreleased**.

Add entries in the same PR as the change, under the matching heading: Added, Changed,
Deprecated, Removed, Fixed or Security. Write for contributors and users, not as a commit log.

## [Unreleased]

### Added

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

- A failing simulation worker now stops the run and shows a message in the viewport, instead of
  leaving the canvas frozen with only a console error.

[Unreleased]: https://github.com/stephenmcardle/math-visualizer/commits/main
