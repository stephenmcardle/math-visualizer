import { describe, expect, it } from "vitest";

import { PALETTES } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable } from "@/templates/lattice/painter";
import { ashkinTellerPainter } from "@/visualizations/ashkin-teller/painter";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";

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
});
