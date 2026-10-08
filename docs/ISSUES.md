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

### ISS-008: Worker runner stalls after a worker crash

- **Captured:** 2026-10-08 · **Type:** debt · **Severity:** low
- **Where:** `src/lib/simulation/worker-runner.ts`
- **Status:** open
- `worker.onerror` logs the error but leaves `inFlight = true`, so no further steps are sent and
  the viewport freezes silently. No visualization uses the worker yet. Fix before the first one
  does: surface the error in the UI or restart the worker.

### ISS-007: Code of Conduct has no reporting contact

- **Captured:** 2026-10-08 · **Type:** chore · **Severity:** high (blocks Milestone 2)
- **Where:** `CODE_OF_CONDUCT.md`
- **Status:** promoted (Roadmap M2)
- Still contains `[INSERT CONTACT METHOD]`. Needs a monitored email address or form before the
  repository goes public.

### ISS-006: Font preload warnings seen once in headless Chrome

- **Captured:** 2026-10-08 · **Type:** question · **Severity:** low
- **Where:** `src/app/layout.tsx` (next/font)
- **Status:** open (needs repro)
- During the first browser check, Chrome warned that two Geist `.woff2` files were preloaded but
  not used within a few seconds. A second run did not reproduce it. If it recurs, consider
  `preload: false` for Geist Mono.

### ISS-005: Cross-browser floating point can differ in the last bit

- **Captured:** 2026-10-08 · **Type:** question · **Severity:** low
- **Where:** simulations using `Math.sin` / `Math.cos` / `Math.exp` etc.
- **Status:** open (documented in README)
- The PRNG is integer-only and identical everywhere, but built-in math functions are not
  guaranteed to be bit-identical across engines. Harmless for the random walk; chaotic systems
  could visibly diverge over long runs. Options if needed: a deterministic math helper module,
  or documenting per-visualization guarantees.

### ISS-004: Canvas state is not available to screen readers

- **Captured:** 2026-10-08 · **Type:** idea · **Severity:** medium
- **Where:** `src/components/visualization/visualization-viewport.tsx`
- **Status:** promoted (Roadmap M4)
- The viewport has `role="img"` and a label, but nothing describes what is happening. Idea: an
  optional `describe(state, params): string` on definitions, announced politely on pause or at
  a low rate.

### ISS-003: Random-walk trails reset on resize and quality change

- **Captured:** 2026-10-08 · **Type:** debt · **Severity:** low
- **Where:** `src/visualizations/random-walk/renderer.ts`
- **Status:** open
- The trail texture is recreated on `resize`, which also runs on auto-quality step-down and on
  phone rotation, so accumulated trails disappear. Possible fix: copy the old texture into the
  new one, offset by the change in center.

### ISS-002: `npm audit` reports 5 high-severity issues in dev tooling

- **Captured:** 2026-10-08 · **Type:** chore · **Severity:** low
- **Where:** `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`
- **Status:** open (waiting on upstream)
- Dev-only; not in the shipped bundle. `npm audit fix --force` would downgrade
  `eslint-config-next` to v14, so don't. Re-check when upgrading Next.js.

### ISS-001: Build emits an unreferenced copy of the worker source

- **Captured:** 2026-10-08 · **Type:** debt · **Severity:** low
- **Where:** build output `out/_next/static/media/simulation.worker.*.ts`
- **Status:** open
- Turbopack 16.4 bundles the worker correctly (`turbopack-worker-*.js`) but also emits the raw
  `.ts` file as an unused static asset. Harmless (the source is public), just clutter. Related:
  passing `{ type: "module" }` to `new Worker(...)` breaks worker bundling entirely (see
  [ADR 0005](decisions/0005-simulation-runners-and-workers.md)). Re-check on Next.js upgrades.

## Closed

_None yet._
