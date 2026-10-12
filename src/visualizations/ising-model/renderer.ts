import { BufferImageSource, Container, Sprite, Texture } from "pixi.js";

import { palette } from "@/lib/rendering/palettes";
import { createOverlayLabel } from "@/lib/rendering/overlay-label";
import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import { DEFAULT_VIEW, isDefaultView, viewTransform } from "@/lib/rendering/view";
import type { IsingParams } from "@/visualizations/ising-model/params";
import type { IsingState } from "@/visualizations/ising-model/simulation";

const MARGIN = 0.92;
/** Enough to pick out single spins in a 512² lattice on a phone. */
const MAX_ZOOM = 16;

/** Pack opaque RGB into one little-endian RGBA pixel (byte order R, G, B, A). */
function packPixel(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return (r | (g << 8) | (b << 16) | (0xff << 24)) >>> 0;
}

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

/**
 * Draws the lattice as a texture with one pixel per spin, scaled up to fit
 * the viewport, plus a readout of temperature and magnetization per spin.
 * The pixel buffer is rewritten only after a new sweep.
 */
export const createIsingRenderer: PixiRendererFactory<IsingParams, IsingState> = (
  app,
  initialContext,
) => {
  let context = initialContext;
  let paletteValue = "";
  let up = 0;
  let down = 0;
  /** Spin up and down take the palette's contrasting pair. Returns true if it changed. */
  const applyPalette = (value: string) => {
    if (value === paletteValue) return false;
    paletteValue = value;
    [up, down] = palette(value).pair.map((color) => packPixel(color));
    return true;
  };

  const lattice = new Sprite();
  const label = createOverlayLabel();
  // Pan and zoom move the lattice; the label stays put.
  const world = new Container();
  world.addChild(lattice);
  app.stage.addChild(world, label.container);

  let side = 0;
  let pixels = new Uint32Array(0);
  let source: BufferImageSource | null = null;
  let view = DEFAULT_VIEW;
  let fitScale = 1;
  let drawnSweeps = -1;

  const applyView = () => {
    const transform = viewTransform(view, context);
    world.position.set(transform.x, transform.y);
    world.scale.set(transform.scale);
    label.setBacked(!isDefaultView(view));
    // Sharp edges once a spin covers a screen pixel or more; smooth sampling
    // below that avoids shimmering.
    if (source) source.scaleMode = fitScale * view.scale >= 1 ? "nearest" : "linear";
  };

  const layout = () => {
    if (side === 0) return;
    const fit = Math.min(context.width, context.height) * MARGIN;
    // Whole-number scales keep every spin the same size on screen.
    const scale = fit >= side ? Math.floor(fit / side) : fit / side;
    fitScale = scale;
    const size = side * scale;
    lattice.position.set(
      Math.round((context.width - size) / 2),
      Math.round((context.height - size) / 2),
    );
    lattice.scale.set(scale);
    applyView();
  };

  const replaceTexture = (nextSide: number) => {
    side = nextSide;
    pixels = new Uint32Array(side * side);
    const previous = lattice.texture;
    source = new BufferImageSource({
      resource: new Uint8Array(pixels.buffer),
      width: side,
      height: side,
      format: "rgba8unorm",
      alphaMode: "premultiplied-alpha",
      scaleMode: "nearest",
    });
    lattice.texture = new Texture({ source });
    if (previous !== Texture.EMPTY) previous.destroy(true);
    layout();
  };

  return {
    reset(state, params) {
      if (state.side !== side) replaceTexture(state.side);
      applyPalette(params.palette);
      drawnSweeps = -1;
    },

    render(state, params) {
      // The palette is live: repaint the current spins in the new colors.
      if (applyPalette(params.palette)) drawnSweeps = -1;
      if (state.sweeps !== drawnSweeps && source) {
        drawnSweeps = state.sweeps;
        const { spins } = state;
        for (let site = 0; site < pixels.length; site++) pixels[site] = spins[site] > 0 ? up : down;
        source.update();
      }

      // The temperature is live, so it can change while paused.
      const m = state.magnetization / state.spins.length;
      const text = `T = ${params.temperature.toFixed(2)}\nm = ${formatSigned(m)}  sweep ${state.sweeps}`;
      label.setText(text);
    },

    resize(next: RenderContext) {
      context = next;
      layout();
    },

    panZoom: {
      minScale: 1,
      maxScale: MAX_ZOOM,
      setView(next) {
        view = next;
        applyView();
      },
    },

    destroy() {
      if (lattice.texture !== Texture.EMPTY) lattice.texture.destroy(true);
    },
  };
};
