# 0008: Interactive 3D camera: renderer-requested frames and a touch policy

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

The Lorenz attractor is the first Three.js visualization. A 3D view needs a movable camera, but
the viewport only draws when the simulation is playing or a param changes (ADR 0006), so moving
the camera while paused drew nothing. On phones, a camera control that captures every touch
would also trap page scrolling inside a viewport that fills most of the screen.

## Decision

- `ThreeContext` gains `requestRender()`, wired to the viewport's frame scheduler. It draws one
  frame without advancing the simulation. Renderers call it from camera-control change events.
- Renderers that add trails only advance them when the simulation step changed, so redraws while
  paused don't age them.
- Camera interaction is rotate-only (`OrbitControls` with zoom and pan disabled): the mouse wheel
  and pinch keep scrolling and zooming the page. The canvas uses `touch-action: pan-y`, so a
  vertical swipe scrolls the page and a horizontal drag rotates the view.
- Camera position is visual state owned by the renderer. It is not stored in the URL.

## Alternatives considered

- **Auto-rotating camera, no interaction:** simplest, but takes control away from the viewer and
  conflicts with reduced-motion preferences while playing.
- **`touch-action: none` (the `OrbitControls` default):** full rotation on touch, but the page
  can't be scrolled by swiping over the canvas.
- **Two-finger rotate on touch ("use two fingers to move the map"):** keeps one-finger scrolling,
  but needs custom gesture handling and an on-screen hint.
- **Camera in the URL:** makes shared links show the same angle, at the cost of URL noise and
  syncing every drag; revisit if people ask for it.

## Consequences

- Any future interactive renderer (Pixi pan/zoom too) can use the same pattern; Pixi's factory
  would need the same callback.
- Touch users can only rotate around the vertical axis. Desktop users can rotate freely.
- The camera is not keyboard-operable yet (ISSUES ISS-012).
