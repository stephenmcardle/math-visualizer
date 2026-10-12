# 0010: End-to-end smoke tests with Playwright against the static build

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

Unit tests run in Node with no DOM (Vitest), so nothing in CI checked that a page actually
renders, that WebGL and the worker start, or that controls reach the URL. Each PR so far was
verified with one-off browser scripts that were thrown away afterwards.

## Decision

- Playwright Test (Chromium only) runs `e2e/*.spec.ts` against the production build in `out/`,
  as a step of the required CI `check` job after `npm run build`.
- The tests are smoke tests, not a full UI suite. They loop over the registry, so each
  visualization must render a non-blank frame (checked through **Save image**), fill its URL with
  every param and the seed, start a worker only if it runs in one, and log no errors. A few host
  tests cover URL state, Copy link, zero DOM mutations while animating, the phone layout and the
  404 page.
- `e2e/static-server.mjs`, a small Node server, mirrors Cloudflare's asset handling (`/about` →
  `about.html`, unknown paths → `404.html` with status 404) instead of a third-party static
  server.
- Chromium gets `--enable-unsafe-swiftshader --use-angle=swiftshader`, so Pixi and Three.js have
  a software WebGL on GPU-less runners.

## Alternatives considered

- **Vitest browser mode or jsdom component tests:** test components in isolation, but not the
  static export, routing, workers or WebGL together.
- **`serve` as the static server:** works, but pulls in a dependency with an open high-severity
  advisory, and its routing differs slightly from Cloudflare's.
- **Firefox and WebKit too:** better coverage of the determinism claims, at about three times the
  CI time. Revisit if a browser-specific bug ships.

## Consequences

- CI takes about a minute longer (browser download and the tests).
- A new visualization is smoke-tested without writing anything.
- Pixel checks only assert "something was drawn", so visual regressions in what is drawn still
  need human review.
