/**
 * Pan and zoom for 2D renderers. World coordinates are the screen coordinates
 * of the default view (CSS pixels), so a renderer lays out as before and only
 * applies the transform. Zoom is relative to the viewport center and pan is in
 * screen pixels, so a view stays roughly in place when the viewport resizes.
 */
export interface View {
  scale: number;
  panX: number;
  panY: number;
}

export interface ViewLimits {
  minScale: number;
  maxScale: number;
}

export interface Size {
  width: number;
  height: number;
}

/** screen = world × scale + (x, y) */
export interface ViewTransform {
  scale: number;
  x: number;
  y: number;
}

export const DEFAULT_VIEW: View = { scale: 1, panX: 0, panY: 0 };

/** Below this, a difference is floating-point noise from zooming in and back out. */
const SNAP = 1e-6;

export function viewTransform(view: View, size: Size): ViewTransform {
  return {
    scale: view.scale,
    x: (size.width / 2) * (1 - view.scale) + view.panX,
    y: (size.height / 2) * (1 - view.scale) + view.panY,
  };
}

/**
 * Keep the scale within limits and the world point at the viewport center
 * inside the default view's rectangle, so the content can't be lost off-screen.
 */
export function clampView(view: View, size: Size, limits: ViewLimits): View {
  let scale = Math.min(limits.maxScale, Math.max(limits.minScale, view.scale));
  if (Math.abs(scale - 1) < SNAP) scale = 1;
  const clampPan = (pan: number, extent: number) => {
    const limit = (scale * extent) / 2;
    const clamped = Math.min(limit, Math.max(-limit, pan));
    return Math.abs(clamped) < SNAP ? 0 : clamped;
  };
  return {
    scale,
    panX: clampPan(view.panX, size.width),
    panY: clampPan(view.panY, size.height),
  };
}

export function panView(view: View, dx: number, dy: number, size: Size, limits: ViewLimits): View {
  return clampView({ ...view, panX: view.panX + dx, panY: view.panY + dy }, size, limits);
}

/** Zoom by `factor`, keeping the world point under the screen point (x, y) in place. */
export function zoomView(
  view: View,
  factor: number,
  x: number,
  y: number,
  size: Size,
  limits: ViewLimits,
): View {
  const before = viewTransform(view, size);
  const scale = Math.min(limits.maxScale, Math.max(limits.minScale, view.scale * factor));
  const worldX = (x - before.x) / before.scale;
  const worldY = (y - before.y) / before.scale;
  return clampView(
    {
      scale,
      panX: x - worldX * scale - (size.width / 2) * (1 - scale),
      panY: y - worldY * scale - (size.height / 2) * (1 - scale),
    },
    size,
    limits,
  );
}

export function isDefaultView(view: View): boolean {
  return view.scale === 1 && view.panX === 0 && view.panY === 0;
}
