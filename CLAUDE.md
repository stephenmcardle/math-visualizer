# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Math Visualizer: a mobile-first, open-source Next.js 16 app of interactive, seeded, shareable
mathematical visualizations. Fully static export deployed to Cloudflare static assets; no
backend. [README.md](README.md) has the full architecture write-up and the step-by-step guide to
adding a visualization; [CONTRIBUTING.md](CONTRIBUTING.md) has conventions.

## Commands

| Command                                      | Purpose                                         |
| -------------------------------------------- | ----------------------------------------------- |
| `npm run dev`                                | Dev server (Turbopack) on http://localhost:3000 |
| `npm run check`                              | lint + typecheck + test + build (what CI runs)  |
| `npm run format` / `format:check`            | Prettier write / check (CI also runs the check) |
| `npm test`                                   | All Vitest tests once                           |
| `npx vitest run src/lib/random/prng.test.ts` | One test file                                   |
| `npx vitest run -t "round-trips"`            | Tests whose name matches                        |
| `npm run build` then `npx serve out`         | Build the static site to `out/` and preview it  |

`npm run typecheck` runs `next typegen` before `tsc`: the global `PageProps<...>` /
`LayoutProps<...>` types used by routes are generated, so plain `tsc` fails on a fresh clone.

Vitest runs in the `node` environment and only picks up `src/**/*.test.ts` (no DOM, no `.tsx`
tests); config is `vitest.config.mts`.

## Workflow

- **Start of session:** read [docs/STATUS.md](docs/STATUS.md); skim open entries in
  [docs/ISSUES.md](docs/ISSUES.md) for the area you're touching; check
  [docs/decisions/](docs/decisions/README.md) before architectural changes. Don't silently reverse
  an accepted ADR; write a superseding one.
- **Out-of-scope finding:** add it to `docs/ISSUES.md` (next `ISS-NNN`, top of Open) instead of
  fixing it in passing.
- **Branches and PRs:** never push to `main`. Changes land only through a pull request whose CI
  `check` job passes. Work on a branch (`feat/...`, `fix/...`, `docs/...`), push it, open a PR
  with `gh pr create` following `.github/pull_request_template.md`, and leave merging to the
  maintainer unless asked. Branch protection enforces this, for admins too: direct pushes and
  force-pushes to `main` are rejected, and PR branches must be up to date with `main`.
- **Before committing:** `npm run check` and `npm run format:check` pass, and docs are updated in
  the same commit: `CHANGELOG.md` (Unreleased), `docs/STATUS.md` (bump "Last updated"),
  `docs/ROADMAP.md`, resolved `docs/ISSUES.md` entries. Conventional commits
  (`feat|fix|chore|test|refactor|docs(scope): ...`).

## Architecture: how a visualization runs

A visualization is a `VisualizationDefinition` (`src/lib/visualization/types.ts`) built in
`src/visualizations/<slug>/definition.ts` and listed in `src/visualizations/registry.ts`.
`createRegistry` validates it (kebab-case slug, `min < max`, `step > 0`, default in range, `seed`
is a reserved param key) and throws on duplicates, so mistakes fail tests and the build.

**Build time.** `src/app/visualizations/[slug]/page.tsx` (server component) prerenders one page
per registry entry (`generateStaticParams`, `dynamicParams = false`), renders the metadata, awaits
the definition's MDX `explanation()` into static HTML, and mounts `VisualizationHost` inside
`<Suspense>`. The Suspense boundary is required: the host reads `useSearchParams`, which only
exists in the browser under static export.

**Configuration (React).** `VisualizationHost` owns params + seed via `useVisualizationUrlState`
(parse from the query string, debounced `history.replaceState` back), plus playing / quality /
reset counter. Controls are generated from the definition's param schema (`params.ts`); there
is no per-visualization controls component.

**Frame loop (outside React).** `VisualizationViewport` creates, once per definition, a
`SimulationRunner` and an engine host, then drives a `requestAnimationFrame` loop. Props reach the
loop through a `latest` ref; effects call three loop controls:

- `restart()` when the seed, a non-`live` param, or the reset counter changes (the effect is keyed
  on a string of exactly those values) → `runner.reset(params, seed)`;
- `redraw()` when playing or any param changes → draw a frame without restarting;
- `applyContext()` on `ResizeObserver` and quality changes → `host.resize()`, which calls the
  renderer's `resize`. For the random walk that **clears the trails**, so never route a plain
  redraw through `applyContext`.

Each frame: `StepClock` converts elapsed time into whole steps (`definition.stepsPerSecond`),
`runner.advance(params, steps)`, then if the runner's snapshot `generation` changed the renderer
gets `reset(state)`, then `render(state)` and `host.present()`. The loop stops scheduling when
paused. The only React state it touches is `onQualityLevelChange` from `applyContext` (resize,
quality change, auto step-down), which is a no-op re-render unless the level actually changes.

**Layers and their contracts**

- Simulation (`src/lib/simulation/types.ts`): `create(params, seed)` + `step(state, params)`, one
  fixed step, mutating plain-data state that holds its own `Rng` (`src/lib/random/prng.ts`). No
  React/DOM/Pixi/Three imports; ESLint bans `Math.random` in `simulation.ts` and
  `src/lib/simulation/`.
- Renderer (`src/lib/rendering/types.ts`): factory receives engine objects and returns
  `reset/render/resize/destroy`. Reads state, never mutates it. Engines and renderers are loaded
  with dynamic `import()` per page (`pixi-host.ts`, `three-host.ts`); the Pixi ticker is off.
  Three.js has a host but no visualization uses it yet.
- Runners (`src/lib/simulation/runner.ts`, `worker-runner.ts`, `worker-protocol.ts`): `execution:
"worker"` moves `step` into `src/workers/simulation.worker.ts`. Worker-run simulations must
  also be listed in `src/workers/simulations.ts` (kept separate so the worker bundle has no
  renderer/MDX code; a test enforces it).
- Quality (`src/lib/rendering/quality.ts`) only changes render resolution/detail, never results,
  and is not stored in the URL.

## Gotchas

- Keep the worker as `new Worker(new URL("../../workers/simulation.worker.ts", import.meta.url))`
  with **no** `{ type: "module" }`; with it, Turbopack 16.4 copies the raw `.ts` file instead of
  bundling a worker (ADR 0005).
- The PRNG test pins exact outputs. If it fails, every shared URL replays differently; treat that
  as a breaking change, not a snapshot to update.
- Static export: no route handlers reading the request, middleware/proxy, `next.config`
  redirects/rewrites/headers, ISR or default image optimization. Cache headers live in
  `public/_headers`.
- shadcn/ui here uses the `base-nova` style on **Base UI**, not Radix: compose with the `render`
  prop (e.g. `<SheetTrigger render={<Button />}>`), not `asChild`; `Slider` needs an array
  `value={[v]}` (a scalar renders two thumbs). Generated components import `cn` from the `cn`
  package and `src/components/ui/` is excluded from Prettier.
- Cite only references you have verified (e.g. resolve the DOI); never invent citations in
  `metadata.ts` or `explanation.mdx`.
