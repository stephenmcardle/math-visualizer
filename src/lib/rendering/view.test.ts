import { describe, expect, it } from "vitest";

import {
  DEFAULT_VIEW,
  clampView,
  isDefaultView,
  panView,
  viewTransform,
  zoomView,
} from "@/lib/rendering/view";

const size = { width: 400, height: 300 };
const limits = { minScale: 0.5, maxScale: 8 };

function toScreen(view: typeof DEFAULT_VIEW, worldX: number, worldY: number) {
  const t = viewTransform(view, size);
  return [worldX * t.scale + t.x, worldY * t.scale + t.y];
}

describe("view", () => {
  it("is the identity transform by default", () => {
    expect(viewTransform(DEFAULT_VIEW, size)).toEqual({ scale: 1, x: 0, y: 0 });
    expect(isDefaultView(DEFAULT_VIEW)).toBe(true);
  });

  it("zooms about the given point, keeping it in place", () => {
    const view = zoomView(DEFAULT_VIEW, 2, 100, 50, size, limits);
    expect(view.scale).toBe(2);
    expect(toScreen(view, 100, 50)).toEqual([100, 50]);
  });

  it("zooming about the center needs no pan", () => {
    const view = zoomView(DEFAULT_VIEW, 3, 200, 150, size, limits);
    expect(view).toEqual({ scale: 3, panX: 0, panY: 0 });
  });

  it("keeps the scale within limits", () => {
    expect(zoomView(DEFAULT_VIEW, 100, 200, 150, size, limits).scale).toBe(8);
    expect(zoomView(DEFAULT_VIEW, 0.01, 200, 150, size, limits).scale).toBe(0.5);
  });

  it("returns exactly to the default view after zooming in and back out", () => {
    let view = DEFAULT_VIEW;
    for (let i = 0; i < 7; i++) view = zoomView(view, 1.25, 200, 150, size, limits);
    for (let i = 0; i < 7; i++) view = zoomView(view, 0.8, 200, 150, size, limits);
    expect(isDefaultView(view)).toBe(true);
  });

  it("pans in screen pixels", () => {
    const view = panView(DEFAULT_VIEW, 30, -20, size, limits);
    expect(view).toEqual({ scale: 1, panX: 30, panY: -20 });
    expect(isDefaultView(view)).toBe(false);
  });

  it("keeps the viewport center over the default view's rectangle", () => {
    expect(panView(DEFAULT_VIEW, 1000, -1000, size, limits)).toEqual({
      scale: 1,
      panX: 200,
      panY: -150,
    });
    // Zoomed in, the same world rectangle is larger on screen, so pan can go further.
    expect(clampView({ scale: 2, panX: 1000, panY: 0 }, size, limits).panX).toBe(400);
  });
});
