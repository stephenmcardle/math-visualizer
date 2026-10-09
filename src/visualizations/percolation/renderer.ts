import { BufferImageSource, Color, Graphics, Sprite, Text, Texture } from "pixi.js";

import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import type { PercolationParams } from "@/visualizations/percolation/params";
import { SPANS, type PercolationState } from "@/visualizations/percolation/simulation";

const PALETTE_SIZE = 64;
const GOLDEN_ANGLE_DEGREES = 137.508;
/** Alpha for clusters that don't span, once some cluster does. */
const DIM_ALPHA = 0.3;
const MARGIN = 0.92;
const NEUTRAL = 0x8a8a8a;

/** Pack premultiplied RGBA into one little-endian pixel (byte order R, G, B, A). */
function packPixel(color: number, alpha: number): number {
  const r = Math.round(((color >> 16) & 0xff) * alpha);
  const g = Math.round(((color >> 8) & 0xff) * alpha);
  const b = Math.round((color & 0xff) * alpha);
  const a = Math.round(255 * alpha);
  return (r | (g << 8) | (b << 16) | (a << 24)) >>> 0;
}

function buildPalette(alpha: number): Uint32Array {
  // Golden-angle hues at mid lightness, as in the random walk: neighbors stay
  // distinguishable and the colors read on light and dark backgrounds.
  return Uint32Array.from({ length: PALETTE_SIZE }, (_, i) =>
    packPixel(new Color({ h: (i * GOLDEN_ANGLE_DEGREES) % 360, s: 70, l: 52 }).toNumber(), alpha),
  );
}

/** Spread cluster ids (site indices, so neighbors are close numbers) across the palette. */
function paletteIndex(clusterId: number): number {
  return Math.imul(clusterId, 0x9e3779b1) >>> 26;
}

function formatP(opened: number, sites: number): string {
  return (opened / sites).toFixed(4);
}

/**
 * Draws the lattice as a texture with one pixel per site, scaled up to fit the
 * viewport. Each open site takes its cluster's color; once a cluster spans
 * top to bottom, spanning clusters stay bright and the rest are dimmed. The
 * pixel buffer is rewritten only when sites have opened since the last frame.
 */
export const createPercolationRenderer: PixiRendererFactory<PercolationParams, PercolationState> = (
  app,
  initialContext,
) => {
  let context = initialContext;
  const bright = buildPalette(1);
  const dim = buildPalette(DIM_ALPHA);

  const backing = new Graphics();
  const lattice = new Sprite();
  const label = new Text({
    text: "",
    style: { fontFamily: "ui-monospace, monospace", fontSize: 13, fill: NEUTRAL },
  });
  label.position.set(12, 10);
  app.stage.addChild(backing, lattice, label);

  let side = 0;
  let pixels = new Uint32Array(0);
  let source: BufferImageSource | null = null;
  let drawnOpened = -1;

  const layout = () => {
    if (side === 0) return;
    const fit = Math.min(context.width, context.height) * MARGIN;
    // Whole-number scales keep every site the same size on screen; below one
    // pixel per site, smooth sampling avoids shimmering.
    const scale = fit >= side ? Math.floor(fit / side) : fit / side;
    if (source) source.scaleMode = scale >= 1 ? "nearest" : "linear";
    const size = side * scale;
    const x = Math.round((context.width - size) / 2);
    const y = Math.round((context.height - size) / 2);
    lattice.position.set(x, y);
    lattice.scale.set(scale);
    backing.clear().rect(x, y, size, size).fill({ color: NEUTRAL, alpha: 0.12 });
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
      drawnOpened = -1;
    },

    render(state) {
      if (state.opened === drawnOpened || !source) return;
      drawnOpened = state.opened;

      const { label: clusterOf, edges } = state;
      const spanned = state.spanningAt !== -1;
      for (let site = 0; site < pixels.length; site++) {
        const id = clusterOf[site];
        if (id === -1) pixels[site] = 0;
        else if (!spanned || edges[id] === SPANS) pixels[site] = bright[paletteIndex(id)];
        else pixels[site] = dim[paletteIndex(id)];
      }
      source.update();

      const sites = side * side;
      label.text = spanned
        ? `p = ${formatP(state.opened, sites)}\nfirst spanned at p = ${formatP(state.spanningAt, sites)}`
        : `p = ${formatP(state.opened, sites)}`;
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
