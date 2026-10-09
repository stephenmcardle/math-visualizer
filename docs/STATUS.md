# Status

**Last updated:** 2026-10-08
**Phase:** Milestone 1 (Development infrastructure) complete; Milestone 2 (Public launch) next.
See [ROADMAP.md](ROADMAP.md).

## Summary

The scaffold and development infrastructure are on `main`. The generic visualization host, the
four architecture layers and one demo visualization (2D random walk) work in the production
build, and CI runs the full check on every push and PR. The GitHub repository is public; the site
is not deployed yet.

## Health

| Check                    | State                                                   |
| ------------------------ | ------------------------------------------------------- |
| `npm run check` (local)  | Passing: lint, typecheck, 42 tests, build               |
| CI (GitHub Actions)      | Passing on `main`; required on PRs by branch protection |
| Deployment               | Not deployed                                            |
| Open capture-log entries | See [ISSUES.md](ISSUES.md)                              |

## What works

- Routes: `/`, `/about`, `/visualizations/[slug]` (static export, one HTML file per route).
- Visualization registry with validation; generic host page; schema-generated controls.
- URL state: params and seed in the query string, debounced `replaceState`.
- Seeded PRNG (sfc32) with pinned reference outputs.
- Fixed-step simulation loop outside React; zero DOM mutations while animating (verified in a
  headless browser).
- PixiJS engine host; Three.js engine host (unused so far).
- Main-thread and Web Worker runners. The worker path was verified in the browser by temporarily
  switching the random walk to `execution: "worker"`.
- Render quality: Auto / Low / Medium / High, with auto step-down on slow frames.
- MDX explanations rendered at build time.
- Light/dark theme, keyboard-accessible controls, reduced-motion start-paused, mobile bottom
  sheet, no horizontal scroll at 390px.

- Development docs (`docs/`), changelog, `CLAUDE.md` agent workflow, and GitHub Actions CI.

## In progress

_Nothing._

## Next up

1. Milestone 2: deploy to Cloudflare with a custom domain (see ROADMAP).
2. README screenshot and live demo link.

## Known limitations

Tracked in more detail in [ISSUES.md](ISSUES.md).

- Random-walk trails reset when the viewport resizes or quality changes.
- At high speeds the random walk draws positions sampled once per frame, not every step
  (by design; documented in its explanation).
- Bit-for-bit reproducibility is guaranteed within one JavaScript engine; across browsers,
  `Math.cos`/`Math.sin` may differ in the last bit.
- The canvas has a label but no screen-reader description of its state.
