import { describe, expect, it } from "vitest";

import { ANGLE_STEPS } from "@/lib/math/angles";
import { PALETTES, palette } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable, packPixel } from "@/templates/lattice/painter";
import { ashkinTellerPainter } from "@/visualizations/ashkin-teller/painter";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
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
});
