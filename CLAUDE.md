# Math Visualizer: agent guide

@AGENTS.md

Mobile-first, open-source Next.js app of interactive, seeded, shareable mathematical
visualizations. Static export deployed to Cloudflare. No backend. Read
[README.md](README.md) for architecture and [CONTRIBUTING.md](CONTRIBUTING.md) for conventions.

## Start of every session

1. Read [docs/STATUS.md](docs/STATUS.md) to see where the project is and what's next.
2. Skim open entries in [docs/ISSUES.md](docs/ISSUES.md) that touch the area you'll work on.
3. For architectural changes, check [docs/decisions/](docs/decisions/README.md) first. Don't
   silently reverse an accepted ADR; propose a superseding one instead.

## While working

- **Noticed something you're not fixing now?** Add it to `docs/ISSUES.md` (next `ISS-NNN` ID,
  top of Open) instead of fixing it out of scope or forgetting it.
- **Made a hard-to-reverse or contested choice?** Write an ADR from `docs/decisions/template.md`
  and add it to the index.
- **Next.js APIs:** this is Next.js 16. Check `node_modules/next/dist/docs/` before relying on
  memory (see AGENTS.md).

## Before committing

1. `npm run check` (lint + typecheck + tests + build) and `npm run format:check` must pass.
2. Update docs in the same commit as the work:
   - `CHANGELOG.md` → Unreleased, for anything a user or contributor would notice;
   - `docs/STATUS.md` → if what works, what's next, or health changed (bump "Last updated");
   - `docs/ROADMAP.md` → tick items or re-scope milestones;
   - `docs/ISSUES.md` → close or update entries you resolved (with the outcome).
3. Conventional commit messages: `feat|fix|chore|test|refactor|docs(scope): message`.

## Architecture rules (enforced in review)

- Simulations (`src/visualizations/*/simulation.ts`) are pure TypeScript: no React, DOM, PixiJS or
  Three.js. One fixed step per `step()`, state is plain data, randomness comes only from the
  seeded `Rng` (`Math.random` is lint-banned there).
- Renderers read state and never mutate it. React holds configuration only; nothing in the
  animation loop may set React state.
- New visualizations are self-contained in `src/visualizations/<slug>/` and registered in
  `src/visualizations/registry.ts`. The host must stay generic.
- Keep the worker `new Worker(new URL(...))` call exactly as written (see ADR 0005).
- Cite only sources you have verified (resolve DOIs). Never invent references.
- Avoid new dependencies unless they clearly pay for themselves.

## Commands

| Command          | Purpose                             |
| ---------------- | ----------------------------------- |
| `npm run dev`    | Dev server on http://localhost:3000 |
| `npm run check`  | lint + typecheck + test + build     |
| `npm test`       | Vitest                              |
| `npm run format` | Prettier write                      |
| `npm run build`  | Static export to `out/`             |
| `npx serve out`  | Preview the production build        |
