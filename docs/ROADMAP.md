# Roadmap

Milestones are ordered but not dated. Each has a goal and an exit criterion so it is clear
when it is done. Move items between milestones freely; record the reason in the changelog or an
ADR if it reflects a change in direction.

Status key: ✅ done · 🚧 in progress · ⬜ not started

## Milestone 0: Scaffold ✅

Goal: prove the architecture with one visualization.

- ✅ Next.js static-export app, shadcn/ui shell, light/dark themes
- ✅ Simulation / renderer / UI / worker layers and visualization registry
- ✅ Seeded PRNG, URL state, schema-generated controls, render quality
- ✅ 2D random walk (PixiJS) with MDX explanation and verified citations
- ✅ Unit tests (PRNG, simulation determinism, params, registry, step clock)
- ✅ README, CONTRIBUTING, Code of Conduct, license, issue and PR templates

Exit: `npm run check` passes and the random walk runs through the full architecture. Met
2026-10-08.

## Milestone 1: Development infrastructure ✅

Goal: make the state of the project and the reasons behind it easy to find.

- ✅ `docs/` with status, roadmap, capture log and ADRs
- ✅ CHANGELOG.md
- ✅ CLAUDE.md agent workflow
- ✅ GitHub Actions CI running `npm run check` and the format check

Exit: CI green on `main`, and the docs are referenced from README and CONTRIBUTING. Met
2026-10-08.

## Milestone 2: Public launch ✅

Goal: a deployed site that outside contributors can find and use.

- ✅ Deploy to Cloudflare (Workers static assets, `wrangler.jsonc`), with a custom domain
- ✅ Make the GitHub repository public
- ✅ Code of Conduct reporting contact (ISSUES: ISS-007)
- ✅ README screenshot and live demo link
- ✅ Branch protection on `main` requiring CI and pull requests (ISSUES: ISS-011)

Exit: the site is live, the repository is public, and the README links to the demo. Met
2026-10-08.

## Milestone 3: Prove the extension points ⬜

Goal: exercise the parts of the architecture the random walk does not.

- ⬜ A second 2D visualization from a different area (e.g. percolation, cellular automata or a
  graph algorithm)
- ⬜ A first Three.js visualization
- ⬜ A first CPU-heavy visualization running in the worker, with transferable-buffer snapshots
  if profiling justifies them
- ⬜ Boolean and enum parameter types; optional per-visualization custom controls
- ⬜ Home page filtering by category, difficulty and tag

Exit: at least three visualizations covering Pixi, Three and worker execution, with no
visualization-specific code in the host.

## Milestone 4: Polish and reach ⬜

- ⬜ Pan and zoom in the viewport
- ⬜ Screen-reader summaries of visualization state
- ⬜ Copy share link and export frame as image
- ⬜ Math typesetting in MDX explanations (e.g. KaTeX)
- ⬜ End-to-end smoke tests for the host page
- ⬜ Auto quality that can step back up after a downgrade

## Ideas (not scheduled)

Capture new ideas in [ISSUES.md](ISSUES.md) first; promote them here once they have a rough
scope.
