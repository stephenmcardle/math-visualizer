/**
 * Color palettes shared by every visualization (ADR 0013). Each offers three
 * views of itself: `colors(count)` gives distinct colors for walkers, clusters
 * or trajectories, `pair` gives two contrasting colors for two-state pictures
 * such as spins, and `wheel(count)` gives colors around a closed loop for
 * angles (ADR 0015). Colors are 0xRRGGBB numbers in sRGB.
 *
 * Pure data and math with no engine imports, so params files (which the
 * worker bundle also loads) can use `paletteParam`.
 */

import type { EnumParamSpec } from "@/lib/url-state/params";

export interface Palette {
  value: string;
  label: string;
  /** `count` colors, spread so that early indices are already far apart. */
  colors(count: number): number[];
  /** [first, second] state, e.g. spin up and spin down. */
  pair: readonly [number, number];
  /**
   * `count` colors for evenly spaced angles, where the last one meets the first.
   * Classic is a hue wheel; a ramp runs out and back, so opposite turning
   * directions share colors.
   */
  wheel(count: number): number[];
}

const GOLDEN_ANGLE_DEGREES = 137.508;
/** 1/φ: successive multiples mod 1 stay evenly spread (golden-ratio sequence). */
const GOLDEN_FRACTION = 0.6180339887498949;

/** HSL (h in degrees, s and l in 0..1) to 0xRRGGBB. */
export function hslToHex(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return (channel(0) << 16) | (channel(8) << 8) | channel(4);
}

/** The color a fraction `t` of the way from `a` to `b`, mixing each channel. */
export function lerpHex(a: number, b: number, t: number): number {
  const mix = (shift: number) => {
    const x = (a >> shift) & 0xff;
    const y = (b >> shift) & 0xff;
    return Math.round(x + (y - x) * t);
  };
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

/** Color at t in [0, 1] along evenly spaced stops. */
export function sampleRamp(stops: readonly number[], t: number): number {
  const position = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(position));
  return lerpHex(stops[i], stops[i + 1], position - i);
}

/**
 * A continuous colormap used as a palette. `range` trims ends that would
 * vanish against a light or dark background when drawn as thin lines; the
 * pair is sampled at two well-separated points.
 */
function rampPalette(
  value: string,
  label: string,
  stops: readonly number[],
  range: readonly [number, number],
  pairAt: readonly [number, number],
): Palette {
  const [lo, hi] = range;
  return {
    value,
    label,
    colors: (count) =>
      Array.from({ length: count }, (_, i) =>
        sampleRamp(stops, lo + (hi - lo) * ((i * GOLDEN_FRACTION) % 1)),
      ),
    pair: [sampleRamp(stops, pairAt[0]), sampleRamp(stops, pairAt[1])],
    wheel: (count) =>
      Array.from({ length: count }, (_, i) =>
        sampleRamp(stops, lo + (hi - lo) * (1 - Math.abs((2 * i) / count - 1))),
      ),
  };
}

function listPalette(
  value: string,
  label: string,
  list: readonly number[],
  pair: readonly [number, number],
): Palette {
  return {
    value,
    label,
    colors: (count) => Array.from({ length: count }, (_, i) => list[i % list.length]),
    pair,
    // The list in order, as equal sectors.
    wheel: (count) =>
      Array.from({ length: count }, (_, i) => list[Math.floor((i * list.length) / count)]),
  };
}

// Ramp stops are 17 even samples of d3-scale-chromatic 3.1.0 (ISC License,
// Copyright 2010-2024 Mike Bostock). Its viridis, plasma and cividis data come
// from matplotlib's colormaps; turbo is d3's fit of Google's Turbo colormap.
const VIRIDIS = [
  0x440154, 0x48186a, 0x472d7b, 0x424086, 0x3b528b, 0x33638d, 0x2c728e, 0x26828e, 0x21918c,
  0x1fa088, 0x28ae80, 0x3fbc73, 0x5ec962, 0x84d44b, 0xaddc30, 0xd8e219, 0xfde725,
];
const PLASMA = [
  0x0d0887, 0x310597, 0x4c02a1, 0x6600a7, 0x7e03a8, 0x9511a1, 0xaa2395, 0xbc3587, 0xcc4778,
  0xda5a6a, 0xe66c5c, 0xf0804e, 0xf89540, 0xfdac33, 0xfdc527, 0xf8df25, 0xf0f921,
];
const CIVIDIS = [
  0x002051, 0x012b65, 0x11366c, 0x26426e, 0x3c4d6e, 0x51586e, 0x62646f, 0x727071, 0x7f7c75,
  0x8c8877, 0x9a9478, 0xa9a177, 0xbbaf71, 0xcebd68, 0xe2cb5c, 0xf3da4f, 0xfdea45,
];
const TURBO = [
  0x23171b, 0x493eae, 0x4569ee, 0x3295f7, 0x26bce1, 0x29dcbc, 0x3ff393, 0x65fd6e, 0x95fb51,
  0xc5ec3c, 0xecd12e, 0xffad24, 0xff821d, 0xf05616, 0xcb2f0d, 0xa31302, 0x900c00,
];
const GRAY = [0x000000, 0xffffff];

/**
 * Okabe and Ito's color-blind-safe set, without black (invisible on the dark
 * theme): orange, sky blue, bluish green, yellow, blue, vermilion, reddish purple.
 */
const OKABE_ITO = [0xe69f00, 0x56b4e9, 0x009e73, 0xf0e442, 0x0072b2, 0xd55e00, 0xcc79a7];

export const PALETTES: readonly Palette[] = [
  {
    // The colors every visualization used before palettes existed, so old links look the same.
    // Golden-angle hues keep neighbors distinguishable, and mid lightness reads on both themes.
    value: "classic",
    label: "Classic",
    colors: (count) =>
      Array.from({ length: count }, (_, i) =>
        hslToHex((i * GOLDEN_ANGLE_DEGREES) % 360, 0.7, 0.52),
      ),
    // Orange and blue stay distinct with the common forms of color blindness.
    pair: [0xe8833a, 0x3a76c4],
    wheel: (count) =>
      Array.from({ length: count }, (_, i) => hslToHex((360 * i) / count, 0.7, 0.52)),
  },
  listPalette("okabe-ito", "Okabe–Ito (color-blind safe)", OKABE_ITO, [0xe69f00, 0x0072b2]),
  rampPalette("viridis", "Viridis", VIRIDIS, [0.15, 1], [1, 0]),
  rampPalette("plasma", "Plasma", PLASMA, [0.1, 0.95], [0.9, 0.1]),
  rampPalette("cividis", "Cividis", CIVIDIS, [0.2, 1], [1, 0]),
  rampPalette("turbo", "Turbo", TURBO, [0.1, 0.9], [0.6, 0.1]),
  rampPalette("grayscale", "Grayscale", GRAY, [0.3, 0.7], [0.9, 0.1]),
];

const DEFAULT_PALETTE = PALETTES[0];

/** The palette for a param value; unknown values (which URL parsing already rejects) get Classic. */
export function palette(value: string): Palette {
  return PALETTES.find((p) => p.value === value) ?? DEFAULT_PALETTE;
}

/**
 * The `palette` param every visualization includes. It is live: switching
 * recolors the current run instead of restarting it.
 */
export const paletteParam = {
  type: "enum",
  label: "Palette",
  description: "Colors only; the simulation is unchanged.",
  options: PALETTES.map(({ value, label }) => ({ value, label })),
  default: DEFAULT_PALETTE.value,
  live: true,
} as const satisfies EnumParamSpec;
