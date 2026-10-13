import { palette as paletteNamed, type Palette } from "@/lib/rendering/palettes";
import type { LatticeState } from "@/templates/lattice/simulation";

/**
 * What a lattice model adds to the template's renderer. Kept free of Pixi so
 * painters can be unit tested.
 */
export interface LatticePainter<P, M> {
  /** The colors sites are drawn in, taken from the current palette. */
  colors(palette: Palette, state: LatticeState<M>): readonly number[];
  /** Write every site's pixel, choosing from `table`: the colors above, packed. */
  paint(state: LatticeState<M>, pixels: Uint32Array, table: Uint32Array): void;
  /** The overlay text, e.g. temperature and magnetization. */
  label(state: LatticeState<M>, params: P): string;
}

/** Pack opaque 0xRRGGBB into one little-endian RGBA pixel (byte order R, G, B, A). */
export function packPixel(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return (r | (g << 8) | (b << 16) | (0xff << 24)) >>> 0;
}

/** A model's colors as packed pixels, ready to copy into the lattice texture. */
export function colorTable(colors: readonly number[]): Uint32Array {
  return Uint32Array.from(colors, packPixel);
}

/**
 * `count` colors from `palette`, all different. A short list palette such as
 * Okabe–Ito (7 colors) cycles when it runs out, which would draw two states
 * alike; repeats are replaced with Classic's golden-angle hues, which don't
 * repeat. Palettes themselves keep cycling, since old links rely on it.
 */
export function distinctColors(palette: Palette, count: number): number[] {
  const spare = paletteNamed("classic").colors(2 * count);
  const seen = new Set<number>();
  let next = 0;
  return palette.colors(count).map((color) => {
    while (seen.has(color)) color = spare[next++];
    seen.add(color);
    return color;
  });
}
