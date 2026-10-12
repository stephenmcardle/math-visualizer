# 0011: Screen-reader state descriptions and renderer keyboard input

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The viewport was a labeled `role="img"` with nothing describing what it showed (ISSUES ISS-004),
and the 3D camera could only be moved with a pointer (ISS-012, ADR 0008). Any fix has to keep
the frame loop free of DOM and React work while animating (ADR 0006).

## Decision

- Definitions may provide `describe(state, params): string`, a pure function returning one or
  two plain sentences about the current state. All four visualizations implement it.
- The viewport uses it as its accessible description (`aria-describedby`), updated only while
  paused. While playing, the description is a fixed "Running. Pause to hear…" sentence, so
  animation causes no DOM mutations. When the user pauses, a polite live region announces
  "Paused." followed by the description.
- Renderers may provide `keyboard: { help, onKeyDown(event) }`. When present, the viewport
  becomes focusable (`tabIndex=0`, focus ring), adds `help` to its description, and forwards
  key presses; handled keys have their default prevented, so arrows don't scroll the page.
- The Lorenz renderer maps the arrow keys to 5° camera rotations, ignoring presses with Ctrl,
  Alt or Meta held.

## Alternatives considered

- **Describing at a fixed rate while playing:** keeps the text current, but mutates the DOM
  during animation and makes screen readers re-read a moving target.
- **Rotate buttons next to the 3D viewport:** visible to everyone, but extra UI that only one
  visualization needs, and arrow keys on the focused view are the expected interaction.
- **OrbitControls' built-in keys:** they pan by default and rotate only with a modifier, and they
  listen on a separate element.

## Consequences

- Screen-reader users get state on demand by pausing; the Pause button doubles as "describe".
- A new visualization should add `describe`; a test fails if one is missing.
- Other interactive renderers (e.g. future 2D pan and zoom) can reuse the keyboard hook.
