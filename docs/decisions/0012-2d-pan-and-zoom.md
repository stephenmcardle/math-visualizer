# 0012: Pan and zoom for 2D renderers, and a touch policy for them

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

Lattices of up to 512² sites and random walks that spread past the viewport need pan and zoom.
ADR 0008's touch policy for the 3D camera keeps the page scrollable and leaves the mouse wheel
and pinch to the browser, but zoom gestures are exactly the wheel and pinch. Separately, Pixi's
event system set `touch-action: none` on its canvas, so a swipe over a 2D viewport (most of a
phone screen) did not scroll the page at all.

## Decision

- Renderers may provide `panZoom: { minScale, maxScale, setView(view) }`. The view is a scale
  about the viewport center plus a pan in screen pixels (`src/lib/rendering/view.ts`, pure and
  unit-tested). The renderer applies the transform to its content and keeps fixed overlays,
  such as the lattice readouts, in place.
- The viewport owns all input, so renderers stay engine-only and every 2D visualization gets
  the same gestures (`pan-zoom-input.ts`):
  - **Mouse:** drag to pan; Ctrl/⌘ + wheel zooms about the pointer (trackpad pinches arrive as
    Ctrl + wheel). A plain wheel still scrolls the page.
  - **Touch:** two fingers pinch and pan. The viewport uses `touch-action: pan-x pan-y`, so one
    finger scrolls the page and the browser doesn't pinch-zoom the page there. A two-finger
    move the browser has already started scrolling is left alone.
  - **Keyboard:** plus/minus zoom, arrows pan, 0 resets (unmodified keys only; Ctrl + plus
    still zooms the page). The viewport becomes focusable as in ADR 0011.
  - **Buttons:** Zoom out, Zoom in and Reset view overlay the viewport's corner, disabled at
    the limits, so the feature is discoverable and usable without gestures.
- The view is visual state: not in the URL, kept across restarts and resizes (clamped so the
  viewport center stays over the default view), and included in **Save image**.
- The Pixi host detaches Pixi's event system, which no renderer uses, so the viewport's
  `touch-action` applies.
- The random walk's trails are a screen-space texture. While the view moves, the trail sprite
  is transformed; once it has been still for 200 ms, the texture is redrawn for the new view so
  new segments are sharp. Old trails keep their original resolution.

## Alternatives considered

- **Plain wheel zooms:** standard in map apps, but scrolling the page past a viewport this
  large would zoom it instead.
- **Pan and zoom inside each renderer (like OrbitControls):** duplicates gesture code per
  visualization and makes the buttons and keyboard harder to share.
- **A host-level world container for every Pixi renderer:** less renderer code, but the random
  walk needs its own handling, and labels must stay outside the transform.
- **View in the URL:** same trade-off as the 3D camera in ADR 0008.

## Consequences

- A new 2D renderer opts in by returning `panZoom` and applying `setView`.
- Users who swipe with two fingers expecting to scroll will zoom instead, as in map embeds.
- Zooming into the random walk shows older trails blurred until they scroll away.
- Revisit if a renderer needs pointer input of its own (e.g. drawing on the canvas, ISS-014):
  drag-to-pan would then need a mode or a modifier.
