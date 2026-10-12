# Capture log

A low-friction place to write down bugs, tech debt, ideas and open questions as soon as you
notice them, without stopping your current work. Entries get triaged later: fixed, promoted to a
GitHub issue or the [roadmap](ROADMAP.md), or closed.

GitHub issues remain the place for anything that needs discussion or outside contributors.
This log is for the maintainers' working notes.

## How to add an entry

Copy the template, take the next ID, and add it to the top of **Open**. One line of context is
enough; triage can add detail later.

```md
### ISS-NNN: Short title

- **Captured:** YYYY-MM-DD · **Type:** bug | debt | idea | question | chore · **Severity:** high | medium | low
- **Where:** `src/path/to/file.ts` (or area: build, docs, deploy…)
- **Status:** open | triaged | promoted (#123 / Roadmap M3) | fixed (commit/PR) | won't fix
- What was observed, and how to reproduce it if it's a bug.
```

**Severity guide:** _high_ means broken behavior, data loss or security, or it blocks a
milestone; _medium_ means a user-visible defect with a workaround, or debt that will bite soon;
_low_ means cosmetic, rare, or nice-to-have.

When an entry is resolved, update its **Status** with the outcome and move it to **Closed**.
Keep closed entries; they explain why things are the way they are.

---

## Open

### ISS-014: Per-visualization custom controls

- **Captured:** 2026-10-12 · **Type:** idea · **Severity:** low
- **Where:** `src/components/visualization/param-controls.tsx`, `VisualizationDefinition`
- **Status:** open (moved from Roadmap M3)
- Controls are generated from the param schema only (ADR 0004, 0009). Add an optional
  per-visualization controls component once a visualization needs a control the schema can't
  express (e.g. drawing initial conditions on the canvas). Not needed by the four current ones.

### ISS-013: Lattices use well under the viewport width on phones

- **Captured:** 2026-10-12 · **Type:** idea · **Severity:** low
- **Where:** `src/visualizations/percolation/renderer.ts`, `src/visualizations/ising-model/renderer.ts`
- **Status:** open
- Both renderers scale the lattice by a whole number of pixels per site when a site is at least a
  pixel wide. At 390px wide, a 128-site grid gets 2px per site (256px) out of ~330px available.
  Fractional scales with `nearest` sampling would fill the space at the cost of uneven site
  sizes; decide which looks better on a real phone.

### ISS-010: CI's `ubuntu-latest` moves to Ubuntu 26 on 2026-10-19

- **Captured:** 2026-10-08 · **Type:** chore · **Severity:** low
- **Where:** `.github/workflows/ci.yml`
- **Status:** open
- GitHub annotated the first CI run: the `ubuntu-latest` label will migrate to Ubuntu 26 beginning
  2026-10-19 (actions/runner-images#14748). Nothing in the workflow is OS-version specific, so no
  action is expected. If CI breaks after that date, pin `runs-on: ubuntu-24.04` while
  investigating.

### ISS-009: Auto quality only ever steps down

- **Captured:** 2026-10-08 · **Type:** idea · **Severity:** low
- **Where:** `src/lib/rendering/quality.ts`, `src/components/visualization/visualization-viewport.tsx`
- **Status:** promoted (Roadmap M4)
- A temporary slowdown (e.g. a background tab waking up) permanently lowers "auto" quality until
  reload. Consider stepping back up after sustained headroom, with hysteresis.

### ISS-006: Font preload warnings seen once in headless Chrome

- **Captured:** 2026-10-08 · **Type:** question · **Severity:** low
- **Where:** `src/app/layout.tsx` (next/font)
- **Status:** open (reproduced)
- During the first browser check, Chrome warned that two Geist `.woff2` files were preloaded but
  not used within a few seconds. A second run did not reproduce it. If it recurs, consider
  `preload: false` for Geist Mono.
- 2026-10-08: recurred in headless Chromium on `/visualizations/percolation` (both preloaded
  `.woff2` files) against a local production build.

### ISS-005: Cross-browser floating point can differ in the last bit

- **Captured:** 2026-10-08 · **Type:** question · **Severity:** low
- **Where:** simulations using `Math.sin` / `Math.cos` / `Math.exp` etc.
- **Status:** open (documented in README)
- The PRNG is integer-only and identical everywhere, but built-in math functions are not
  guaranteed to be bit-identical across engines. Harmless for the random walk; chaotic systems
  could visibly diverge over long runs. Options if needed: a deterministic math helper module,
  or documenting per-visualization guarantees.

### ISS-003: Random-walk trails reset on resize and quality change

- **Captured:** 2026-10-08 · **Type:** debt · **Severity:** low
- **Where:** `src/visualizations/random-walk/renderer.ts`
- **Status:** open
- The trail texture is recreated on `resize`, which also runs on auto-quality step-down and on
  phone rotation, so accumulated trails disappear. Possible fix: copy the old texture into the
  new one, offset by the change in center.

### ISS-002: `npm audit` reports high-severity issues in dev tooling

- **Captured:** 2026-10-08 · **Type:** chore · **Severity:** low
- **Where:** `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`
- **Status:** open (waiting on upstream)
- Dev-only; not in the shipped bundle. `npm audit fix --force` would downgrade
  `eslint-config-next` to v14, so don't. Re-check when upgrading Next.js.
- 2026-10-12: now 9 advisories, all from the same `braces` issue; the shadcn CLI (`shadcn` →
  `@shadcn/registry`, `ts-morph`) pulls it in through `fast-glob` too. Still dev-only.
- 2026-10-12: `katex` 0.16 adds 4 low advisories (GHSA-238p-pmpm-9mq7, prototype pollution
  bypassing `trust`; fixed in 0.18.2). KaTeX runs only at build time on our own MDX, so it doesn't
  apply. `rehype-katex` 7 depends on `katex` ^0.16; move up when it allows 0.18.

### ISS-001: Build emits an unreferenced copy of the worker source

- **Captured:** 2026-10-08 · **Type:** debt · **Severity:** low
- **Where:** build output `out/_next/static/media/simulation.worker.*.ts`
- **Status:** open
- Turbopack 16.4 bundles the worker correctly (`turbopack-worker-*.js`) but also emits the raw
  `.ts` file as an unused static asset. Harmless (the source is public), just clutter. Related:
  passing `{ type: "module" }` to `new Worker(...)` breaks worker bundling entirely (see
  [ADR 0005](decisions/0005-simulation-runners-and-workers.md)). Re-check on Next.js upgrades.

## Closed

### ISS-012: 3D camera is not keyboard-operable

- **Captured:** 2026-10-08 · **Type:** idea · **Severity:** medium
- **Where:** `src/visualizations/lorenz-attractor/renderer.ts`, ADR 0008
- **Status:** fixed (ADR 0011: the viewport is focusable and the arrow keys rotate the camera)
- The Lorenz camera rotates only by pointer drag. Keyboard users can't change the view, and the
  canvas isn't focusable. Options: make the viewport focusable and map arrow keys to rotation
  (OrbitControls' built-in keys pan, which is disabled), or add rotate buttons. Related to
  ISS-004.

### ISS-004: Canvas state is not available to screen readers

- **Captured:** 2026-10-08 · **Type:** idea · **Severity:** medium
- **Where:** `src/components/visualization/visualization-viewport.tsx`
- **Status:** fixed (ADR 0011: `describe` on all four definitions, used as the description while
  paused and announced on pause)
- The viewport has `role="img"` and a label, but nothing describes what is happening. Idea: an
  optional `describe(state, params): string` on definitions, announced politely on pause or at
  a low rate.

### ISS-015: `npm audit` reports 9 high-severity advisories in dev tooling

- **Captured:** 2026-10-12 · **Type:** chore · **Severity:** low
- **Where:** `package-lock.json` (`shadcn`, `eslint-config-next`)
- **Status:** won't fix (duplicate of ISS-002, which now has the current count)
- All come from `braces` (stack-exhaustion DoS) through `micromatch` / `fast-glob`, used by the
  shadcn CLI and the Next ESLint plugin. Both run only on developer machines and in CI, never in
  the static site. Update when upstream releases fixed versions; `npm audit fix --force` would
  downgrade shadcn.

### ISS-008: Worker runner stalls after a worker crash

- **Captured:** 2026-10-08 · **Type:** debt · **Severity:** low
- **Where:** `src/lib/simulation/worker-runner.ts`
- **Status:** fixed (percolation PR: failures are terminal and shown in the viewport; no automatic restart)
- `worker.onerror` logs the error but leaves `inFlight = true`, so no further steps are sent and
  the viewport freezes silently. No visualization uses the worker yet. Fix before the first one
  does: surface the error in the UI or restart the worker.

### ISS-011: GitHub can't enforce branch protection on `main` yet

- **Captured:** 2026-10-08 · **Type:** chore · **Severity:** medium
- **Where:** GitHub repository settings
- **Status:** fixed (repository made public; protection applied 2026-10-08)
- Both classic branch protection and repository rulesets return HTTP 403 ("Upgrade to GitHub Pro
  or make this repository public") for this private repository on the free plan. Until then, the
  PR-only rule is policy only. When unblocked, apply: required status check `check` (strict),
  pull request required with 0 approvals, enforce for admins, block force-pushes and deletion.

### ISS-007: Code of Conduct has no reporting contact

- **Captured:** 2026-10-08 · **Type:** chore · **Severity:** high (blocks Milestone 2)
- **Where:** `CODE_OF_CONDUCT.md`
- **Status:** fixed (Google Form reporting contact; reports can be anonymous)
- Still contains `[INSERT CONTACT METHOD]`. Needs a monitored email address or form before the
  repository goes public.
