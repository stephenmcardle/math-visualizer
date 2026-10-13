import { describe, expect, it } from "vitest";

import { PALETTES } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable } from "@/templates/lattice/painter";
import { pottsPainter } from "@/visualizations/potts-model/painter";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";

describe("Potts painter", () => {
  it("gives every state its own color, for every q and every palette", () => {
    // The renderer rebuilds its color table on every reset, and q is not live, so a
    // new q always gets a table of the right length. Okabe–Ito has only 7 colors.
    for (const choice of PALETTES) {
      for (let q = pottsParams.q.min; q <= pottsParams.q.max; q++) {
        const where = `${choice.value}, q = ${q}`;
        const params = { ...defaultParams(pottsParams), side: 32, q };
        const state = pottsSimulation.create(params, 1);
        const table = colorTable(pottsPainter.colors(choice, state));
        expect(new Set(table).size, where).toBe(q);
        const pixels = new Uint32Array(32 * 32);
        pottsPainter.paint(state, pixels, table);
        expect(
          pixels.every((pixel) => table.includes(pixel)),
          where,
        ).toBe(true);
      }
    }
  });
});
