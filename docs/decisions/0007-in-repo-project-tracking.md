# 0007: In-repo status, roadmap and capture log

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Much of the development happens in sessions with AI coding agents as well as people. Context
about what is done, what is planned and what was noticed but not fixed needs to survive between
sessions and be visible in code review.

## Decision

Track project state in version-controlled Markdown under `docs/`: `STATUS.md` (current
snapshot), `ROADMAP.md` (milestones with exit criteria), `ISSUES.md` (capture log), and
`decisions/` (ADRs). Keep `CHANGELOG.md` at the root in Keep a Changelog format. `CLAUDE.md`
tells agents to read and update these as part of normal work. Docs updates ship in the same
commit or PR as the work they describe.

GitHub issues remain the place for discussion and outside contributors. Capture-log entries are
promoted to issues when they need either.

## Alternatives considered

- **GitHub Issues/Projects only:** good for collaboration, but not readable offline or in a
  diff, and easy for an agent session to miss.
- **A single TODO file:** low friction, but mixes status, plans and bugs, and loses history.

## Consequences

- Project state is reviewable alongside code and available to every session.
- These docs can go stale. STATUS.md carries a "last updated" date, and the PR template asks
  whether docs need updating.
