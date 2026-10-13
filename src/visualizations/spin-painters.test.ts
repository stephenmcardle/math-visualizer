import { describe, expect, it } from "vitest";

import { ANGLE_STEPS } from "@/lib/math/angles";
import { PALETTES, palette } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable, packPixel } from "@/templates/lattice/painter";
import { ashkinTellerPainter } from "@/visualizations/ashkin-teller/painter";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
import { o3Painter } from "@/visualizations/o3-model/painter";
import { o3Params } from "@/visualizations/o3-model/params";
import { o3Simulation } from "@/visualizations/o3-model/simulation";
import { xyPainter } from "@/visualizations/xy-model/painter";
import { xyParams } from "@/visualizations/xy-model/params";
import { xySimulation } from "@/visualizations/xy-model/simulation";

describe("spin painters", () => {
  it("Ashkin–Teller: four different colors in every palette", () => {
    const state = ashkinTellerSimulation.create(
      { ...defaultParams(ashkinTellerParams), side: 32 },
      1,
    );
    for (const choice of PALETTES) {
      const table = colorTable(ashkinTellerPainter.colors(choice, state));
      expect(new Set(table).size, choice.value).toBe(4);
    }
  });

  it("XY: colors each angle from the palette's wheel", () => {
    const state = xySimulation.create({ ...defaultParams(xyParams), side: 32, start: "up" }, 1);
    state.angles[1] = ANGLE_STEPS / 4;
    const wheel = palette("classic").wheel(256);
    const table = colorTable(xyPainter.colors(palette("classic"), state));
    const pixels = new Uint32Array(32 * 32);
    xyPainter.paint(state, pixels, table);
    expect([pixels[0], pixels[1]]).toEqual([packPixel(wheel[0]), packPixel(wheel[64])]);
  });

  it("O(3): shades from the second color (down) through gray to the first (up)", () => {
    const state = o3Simulation.create({ ...defaultParams(o3Params), side: 32, start: "up" }, 1);
    const [up, down] = palette("classic").pair;
    const colors = o3Painter.colors(palette("classic"), state);
    // The end shades sit half a shade in from the pure colors, so compare loosely.
    const near = (a: number, b: number) =>
      [16, 8, 0].every((shift) => Math.abs(((a >> shift) & 0xff) - ((b >> shift) & 0xff)) <= 4);
    expect(near(colors[0], down)).toBe(true);
    expect(near(colors[colors.length - 1], up)).toBe(true);
    const table = colorTable(colors);
    const pixels = new Uint32Array(32 * 32);
    o3Painter.paint(state, pixels, table);
    expect(pixels.every((pixel) => pixel === table[table.length - 1])).toBe(true);
  });
});
