import { describe, expect, it } from "vitest";

import { PALETTES, hslToHex, palette, paletteParam, sampleRamp } from "@/lib/rendering/palettes";
import { validateDefinition } from "@/lib/visualization/registry";
import { visualizations } from "@/visualizations/registry";

/** WCAG relative luminance of an sRGB color. */
function luminance(color: number): number {
  const [r, g, b] = [16, 8, 0].map((shift) => {
    const c = ((color >> shift) & 0xff) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("palettes", () => {
  it("converts HSL like CSS", () => {
    expect(hslToHex(0, 1, 0.5)).toBe(0xff0000);
    expect(hslToHex(120, 1, 0.25)).toBe(0x008000);
    expect(hslToHex(240, 1, 0.5)).toBe(0x0000ff);
    expect(hslToHex(0, 0, 0.5)).toBe(0x808080);
  });

  it("Classic reproduces the colors used before palettes existed", () => {
    // Golden-angle hues at 70% saturation, 52% lightness, and the orange/blue spin pair.
    expect(palette("classic").colors(3)).toEqual([0xda2f2f, 0x2fda61, 0x932fda]);
    expect(palette("classic").pair).toEqual([0xe8833a, 0x3a76c4]);
  });

  it("interpolates ramps between their stops", () => {
    const stops = [0x000000, 0xff0000, 0xffffff];
    expect(sampleRamp(stops, 0)).toBe(0x000000);
    expect(sampleRamp(stops, 0.25)).toBe(0x800000);
    expect(sampleRamp(stops, 0.5)).toBe(0xff0000);
    expect(sampleRamp(stops, 1)).toBe(0xffffff);
    expect(sampleRamp(stops, 2)).toBe(0xffffff);
  });

  it("gives any number of colors, and the same prefix for any count", () => {
    for (const p of PALETTES) {
      const many = p.colors(500);
      expect(many).toHaveLength(500);
      for (const color of many) expect(color).toBe(color & 0xffffff);
      expect(p.colors(7)).toEqual(many.slice(0, 7));
    }
  });

  it("gives every palette a pair that is easy to tell apart", () => {
    for (const p of PALETTES) {
      const [a, b] = p.pair.map(luminance);
      const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      // Classic's orange/blue differ mostly in hue, so it has the lowest ratio.
      expect(contrast, p.value).toBeGreaterThan(1.5);
    }
  });

  it("falls back to Classic for unknown values", () => {
    expect(palette("nope")).toBe(palette("classic"));
  });

  it("is a valid live enum param, offered by every visualization", () => {
    expect(PALETTES.map((p) => p.value)).toEqual(paletteParam.options.map((o) => o.value));
    expect(new Set(PALETTES.map((p) => p.value)).size).toBe(PALETTES.length);
    for (const definition of visualizations.list()) {
      expect(definition.params.palette, definition.metadata.slug).toBe(paletteParam);
      expect(validateDefinition(definition)).toEqual([]);
    }
  });
});
