# Architecture decision records

Short records of decisions that shaped the codebase, so future contributors can see why things
are the way they are before changing them.

Write an ADR when a choice is hard to reverse, affects many files or every visualization, or is
likely to be questioned later. Small, local choices belong in code comments.

## Process

1. Copy [template.md](template.md) to `NNNN-short-title.md` with the next number.
2. Fill it in. Keep it to about a page.
3. Add it to the index below, in the same PR as the change it describes.
4. To change a decision, write a new ADR that supersedes the old one, and set the old one's
   status to `Superseded by NNNN`. Don't rewrite accepted ADRs.

## Index

| #                                                  | Title                                              | Status   | Date       |
| -------------------------------------------------- | -------------------------------------------------- | -------- | ---------- |
| [0001](0001-static-export-on-cloudflare.md)        | Static export deployed as Cloudflare static assets | Accepted | 2026-10-08 |
| [0002](0002-fixed-step-pure-simulations.md)        | Fixed-step, pure, plain-data simulations           | Accepted | 2026-10-08 |
| [0003](0003-seeded-prng-sfc32.md)                  | sfc32 PRNG seeded via splitmix32                   | Accepted | 2026-10-08 |
| [0004](0004-schema-driven-params-and-url-state.md) | Schema-driven params, controls and URL state       | Accepted | 2026-10-08 |
| [0005](0005-simulation-runners-and-workers.md)     | Simulation runners and opt-in Web Workers          | Accepted | 2026-10-08 |
| [0006](0006-engine-hosts-and-lazy-renderers.md)    | Engine hosts and lazily loaded renderers           | Accepted | 2026-10-08 |
| [0007](0007-in-repo-project-tracking.md)           | In-repo status, roadmap and capture log            | Accepted | 2026-10-08 |
| [0008](0008-interactive-3d-camera.md)              | Interactive 3D camera and touch policy             | Accepted | 2026-10-08 |
