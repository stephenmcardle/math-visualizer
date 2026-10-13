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

## Milestone 3: Prove the extension points ✅

Goal: exercise the parts of the architecture the random walk does not.

- ✅ A second 2D visualization from a different area: site percolation
- ✅ A first Three.js visualization: the Lorenz attractor, with a rotate-only camera
- ✅ A first visualization running in the worker: site percolation. Profiling: a full 512×512
  sweep takes ~37 ms of compute and cloning the state ~1.2 ms per frame, so snapshots stay on
  structured clone and transferable buffers are not justified yet.
- ✅ A visualization that needs the worker for speed: the Ising model. A 512×512 Metropolis sweep
  takes ~8 ms on a desktop, and 100 sweeps per second keep the page at 60 fps with no long
  tasks on the main thread.
- ✅ Boolean and enum parameter types (ADR 0009; first used by the random walk)
- Moved: home page filtering to Milestone 4 (four visualizations don't need it yet), and
  per-visualization custom controls to the capture log (ISS-014; no visualization needs one
  yet).

Exit: at least three visualizations covering Pixi, Three and worker execution, with no
visualization-specific code in the host. Met 2026-10-08 with the Lorenz attractor; the milestone
closed 2026-10-12 with the Ising model.

## Milestone 4: Polish and reach ✅

- ✅ Pan and zoom in the 2D viewports (ADR 0012)
- ✅ Screen-reader summaries of visualization state, and a keyboard-operable 3D camera (ADR 0011)
- ✅ Copy share link and export frame as image
- ✅ Math typesetting in MDX explanations (KaTeX at build time)
- ✅ End-to-end smoke tests for the host page and every visualization (ADR 0010)
- ✅ Auto quality that can step back up after a downgrade (ISS-009)
- ✅ Home page filtering by category, difficulty and tag (moved from Milestone 3)

Exit: every item above is shipped. Met 2026-10-12.

## Milestone 5: Templates and the first openai/math models 🚧

Goal: show the 11 "do now" models from the [openai/math review](research/openai-math-candidates.md)
on shared templates ([design](plans/2026-10-12-template-system-design.md)). Exit criterion: all
11 are live, each with a pinned replay test and verified references.

- ✅ Color palettes on every visualization, switchable mid-run (ADR 0013)
- ✅ Lattice template, Ising ported, Potts model, model families and switcher (ADR 0014)
- Remaining lattice models: random-bond Ising, Ashkin–Teller, XY, O(3)
- Planar-particle template, random walk ported, and four models
- Lattice-growth template, percolation ported, and two models

## Ideas (not scheduled)

Capture new ideas in [ISSUES.md](ISSUES.md) first; promote them here once they have a rough
scope.
