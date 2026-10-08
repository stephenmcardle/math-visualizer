# Project docs

Working documents for developing Math Visualizer. The top-level [README](../README.md) is for
users and new contributors. These files track where the project is and why.

| File                               | Purpose                                                          | Update when                                       |
| ---------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| [STATUS.md](STATUS.md)             | Snapshot of the project right now: what works, what's next       | Work lands, priorities change, health changes     |
| [ROADMAP.md](ROADMAP.md)           | Planned milestones and their scope                               | A milestone is planned, re-scoped or completed    |
| [ISSUES.md](ISSUES.md)             | Capture log: bugs, debt, ideas and questions noticed during work | You notice something you are not fixing right now |
| [decisions/](decisions/README.md)  | Architecture decision records (ADRs)                             | A choice is made that someone might later revisit |
| [../CHANGELOG.md](../CHANGELOG.md) | User-visible and contributor-visible changes                     | Every change worth mentioning, in the same PR     |

## How they fit together

```
notice something ──▶ ISSUES.md (capture, one line is fine)
                         │ triage
          ┌──────────────┼───────────────────┐
          ▼              ▼                   ▼
   fix it now     GitHub issue        ROADMAP.md item
          │        (needs discussion)   (planned work)
          ▼
   CHANGELOG.md (Unreleased) + STATUS.md
          │
   big or contested choice? ──▶ decisions/NNNN-*.md
```

## Conventions

- Dates are ISO `YYYY-MM-DD`.
- Keep entries short and factual. Link to code (`src/...`), PRs and GitHub issues instead of
  repeating them.
- Don't delete history: close capture-log entries with a resolution, mark roadmap items done,
  and supersede ADRs instead of rewriting them.
- Docs changes ride along in the same PR as the work they describe.
