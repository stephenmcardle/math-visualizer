import { BufferImageSource, Sprite, Text, Texture } from "pixi.js";

import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import type { IsingParams } from "@/visualizations/ising-model/params";
import type { IsingState } from "@/visualizations/ising-model/simulation";

/** Orange and blue stay distinct with the common forms of color blindness. */
const UP = 0xe8833a;
const DOWN = 0x3a76c4;
const MARGIN = 0.92;
const NEUTRAL = 0x8a8a8a;

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
  const up = packPixel(UP);
  const down = packPixel(DOWN);

  const lattice = new Sprite();
  const label = new Text({
    text: "",
    style: { fontFamily: "ui-monospace, monospace", fontSize: 13, fill: NEUTRAL },
  });
  label.position.set(12, 10);
  app.stage.addChild(lattice, label);

  let side = 0;
  let pixels = new Uint32Array(0);
  let source: BufferImageSource | null = null;
  let drawnSweeps = -1;
  let labelText = "";

  const layout = () => {
    if (side === 0) return;
    const fit = Math.min(context.width, context.height) * MARGIN;
    // Whole-number scales keep every spin the same size on screen; below one
    // pixel per spin, smooth sampling avoids shimmering.
    const scale = fit >= side ? Math.floor(fit / side) : fit / side;
    if (source) source.scaleMode = scale >= 1 ? "nearest" : "linear";
    const size = side * scale;
    lattice.position.set(
      Math.round((context.width - size) / 2),
      Math.round((context.height - size) / 2),
    );
    lattice.scale.set(scale);
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
    reset(state) {
      if (state.side !== side) replaceTexture(state.side);
      drawnSweeps = -1;
    },

    render(state, params) {
      if (state.sweeps !== drawnSweeps && source) {
        drawnSweeps = state.sweeps;
        const { spins } = state;
        for (let site = 0; site < pixels.length; site++) pixels[site] = spins[site] > 0 ? up : down;
        source.update();
      }

      // The temperature is live, so it can change while paused.
      const m = state.magnetization / state.spins.length;
      const text = `T = ${params.temperature.toFixed(2)}\nm = ${formatSigned(m)}  sweep ${state.sweeps}`;
      if (text !== labelText) label.text = labelText = text;
    },

    resize(next: RenderContext) {
      context = next;
      layout();
    },

    destroy() {
      if (lattice.texture !== Texture.EMPTY) lattice.texture.destroy(true);
    },
  };
};
