export interface PanZoomHandlers {
  /** Move the content by (dx, dy) screen pixels. */
  pan(dx: number, dy: number): void;
  /** Zoom by `factor` about (x, y), in pixels from the element's top left. */
  zoom(factor: number, x: number, y: number): void;
}

/** Trackpad pinches arrive as Ctrl + wheel with deltaY ≈ −100 · ln(scale). */
const WHEEL_ZOOM_RATE = 0.01;
/** A mouse wheel notch is ~100 px, which would be a 2.7× jump; cap each event. */
const MAX_WHEEL_FACTOR = 1.25;
const LINE_HEIGHT = 16;

/**
 * Pointer and touch input for a pannable, zoomable viewport, following the
 * touch policy of ADR 0012: input that would otherwise scroll the page still
 * does, so plain wheel and one-finger swipes scroll, and only Ctrl/⌘ + wheel,
 * mouse drags and two-finger gestures move the view. The element needs
 * `touch-action: pan-x pan-y`. Returns a function that detaches the listeners.
 */
export function attachPanZoomInput(element: HTMLElement, handlers: PanZoomHandlers): () => void {
  const local = (clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const unit =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? LINE_HEIGHT
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? element.clientHeight
          : 1;
    const factor = Math.exp(-event.deltaY * unit * WHEEL_ZOOM_RATE);
    const { x, y } = local(event.clientX, event.clientY);
    handlers.zoom(Math.min(MAX_WHEEL_FACTOR, Math.max(1 / MAX_WHEEL_FACTOR, factor)), x, y);
  };

  // Mouse only: a pen or finger on a touchscreen scrolls the page like a swipe.
  let drag: { id: number; x: number; y: number } | null = null;
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    element.setPointerCapture(event.pointerId);
    element.style.cursor = "grabbing";
  };
  const onPointerMove = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    handlers.pan(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
  };
  const onPointerEnd = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    drag = null;
    element.style.cursor = "grab";
  };

  let pinch: { x: number; y: number; distance: number } | null = null;
  const measure = (touches: TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    return {
      ...local((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2),
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    };
  };
  const onTouchChange = (event: TouchEvent) => {
    pinch = event.touches.length === 2 ? measure(event.touches) : null;
  };
  const onTouchMove = (event: TouchEvent) => {
    // A move that can't be canceled means the browser is already scrolling the
    // page (the first finger moved before the second landed); let it.
    if (!pinch || event.touches.length !== 2 || !event.cancelable) return;
    event.preventDefault();
    const next = measure(event.touches);
    handlers.pan(next.x - pinch.x, next.y - pinch.y);
    if (pinch.distance > 0) handlers.zoom(next.distance / pinch.distance, next.x, next.y);
    pinch = next;
  };

  element.style.cursor = "grab";
  element.addEventListener("wheel", onWheel, { passive: false });
  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerEnd);
  element.addEventListener("pointercancel", onPointerEnd);
  element.addEventListener("touchstart", onTouchChange, { passive: true });
  element.addEventListener("touchend", onTouchChange, { passive: true });
  element.addEventListener("touchcancel", onTouchChange, { passive: true });
  element.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    element.style.cursor = "";
    element.removeEventListener("wheel", onWheel);
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerEnd);
    element.removeEventListener("pointercancel", onPointerEnd);
    element.removeEventListener("touchstart", onTouchChange);
    element.removeEventListener("touchend", onTouchChange);
    element.removeEventListener("touchcancel", onTouchChange);
    element.removeEventListener("touchmove", onTouchMove);
  };
}
