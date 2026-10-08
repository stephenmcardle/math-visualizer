# Contributing

Thanks for your interest in contributing! New visualizations, fixes, and improvements to
documentation and accessibility are all welcome.

By participating you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

Requirements: Node.js 20.9 or newer (22 LTS recommended) and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

Before opening a pull request, run the full check:

```bash
npm run check        # lint + typecheck + tests + production build
npm run format       # Prettier
```

Individual commands: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:watch`,
`npm run build`.

## Branches and pull requests

- Branch from `main`, using a descriptive name such as `viz/percolation` or `fix/seed-input`.
- Keep pull requests focused: one visualization or one change per PR.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, e.g.
  `feat(viz): add bond percolation`, `fix(url-state): clamp negative seeds`.
- Fill in the pull request template. For visual changes, include a screenshot or a link with a
  seed so reviewers can reproduce what you saw.
- Open an issue first for large changes to shared infrastructure (the host, viewport, registry or
  URL state), so the approach can be discussed before you invest time.

## Project docs

Working documents live in [`docs/`](docs/README.md):

- [STATUS.md](docs/STATUS.md): where the project is and what's next. Read this first.
- [ROADMAP.md](docs/ROADMAP.md): milestones and their exit criteria.
- [ISSUES.md](docs/ISSUES.md): capture log for bugs, debt and ideas noticed during work. Add an
  entry rather than fixing unrelated things in your PR.
- [decisions/](docs/decisions/README.md): architecture decision records. Read the relevant ones
  before changing architecture; propose a new ADR to change a decision.

Update [CHANGELOG.md](CHANGELOG.md) (under Unreleased) in the same PR for any change a user or
contributor would notice, and update STATUS/ROADMAP/ISSUES if your change affects them.

CI runs `npm run check` and `npm run format:check` on every push and pull request to `main`.

## Adding a visualization

The [README](README.md#adding-a-new-visualization) has the step-by-step guide. In short:
create `src/visualizations/<slug>/` with `params.ts`, `simulation.ts`, `renderer.ts`,
`metadata.ts`, `definition.ts` and optionally `explanation.mdx`, register the definition in
`src/visualizations/registry.ts`, and add determinism tests.

A good first visualization is small. Aim for one clear idea with a few meaningful parameters
rather than a large configurable system.

## Simulation / renderer separation

This is the most important convention in the codebase.

- **Simulation** (`simulation.ts`): pure TypeScript. No imports from React, PixiJS, Three.js or
  the DOM. State is plain data (numbers, arrays, TypedArrays, plain objects) so it can be cloned
  to a Web Worker. `step` advances exactly one fixed step; there is no wall-clock `dt`.
- **Randomness**: never use `Math.random()` in simulation code (ESLint enforces this). Store an
  `Rng` from `@/lib/random/prng` in your state and draw from it.
- **Renderer** (`renderer.ts`): reads state and draws it. It must not mutate simulation state or
  make decisions that change the simulation's outcome. Visual-only memory (e.g. accumulated
  trails) is fine to keep in the renderer.
- **UI**: controls come from the parameter schema. React holds configuration, never per-frame
  data.

If a simulation is CPU-heavy, set `execution: "worker"` in its definition and add it to
`src/workers/simulations.ts`. Nothing else needs to change.

## Coding conventions

- TypeScript strict mode; avoid `any` outside the generic registry types.
- Prettier formatting (`npm run format`), ESLint clean (`npm run lint`).
- Explicit over implicit. Comments explain _why_, not _what_.
- Keep functions small. Avoid new abstractions until a second visualization needs them.
- Avoid new dependencies unless they clearly pay for themselves; mention any you add in the PR.
- Prefer named exports.

## Citing sources and respecting licenses

Mathematical visualizations often build on published work. We require:

- **Cite what you used.** If a visualization is based on a paper, book, lecture notes or
  another implementation, list it in `metadata.ts` (`references`) and mention it in
  `explanation.mdx`. Prefer DOIs or arXiv links.
- **Only cite sources you have actually read.** Never add plausible-looking references you have
  not verified.
- **Respect licenses.** Do not copy code from another project unless its license is compatible
  with Apache-2.0 and you keep the required attribution and notices. When in doubt, ask in the PR.
  Do not paste copyrighted text or figures from papers.
- **Keep explanations accurate.** State what the visualization shows and its simplifications
  (e.g. sampling, discretization, finite size).

## Accessibility expectations

- Every control must be operable with a keyboard and have a visible label.
- Do not remove focus outlines; use the existing `focus-visible` styles.
- Ensure text meets WCAG AA contrast in both light and dark themes.
- Respect `prefers-reduced-motion`; the host already starts paused in that case, so do not
  auto-start animation elsewhere.
- Colors in a visualization should not be the only way to convey essential information.
- Test with a narrow (phone-sized) viewport and touch input.

## Performance expectations

- Simulations should stay interactive on a mid-range phone at default parameters.
- Do not trigger React state updates from the animation loop.
- In renderers, avoid allocating objects per element per frame; reuse buffers and graphics.
- Use TypedArrays for large numeric state.
- Keep parameter ranges sensible: maxima should still run acceptably at "Low" quality.
- Engines are loaded lazily per page; don't import PixiJS or Three.js from shared modules.

## Reporting bugs and requesting features

Use the issue templates. For bugs, include the full URL (with seed) so the problem can be
reproduced exactly.
