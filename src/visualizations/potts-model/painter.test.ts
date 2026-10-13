import { describe, expect, it } from "vitest";

import { palette } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable } from "@/templates/lattice/painter";
import { pottsPainter } from "@/visualizations/potts-model/painter";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";

describe("Potts painter", () => {
  it("gives every state its own color, for every q", () => {
    // The renderer rebuilds its color table on every reset, and q is not live, so a
    // new q always gets a table of the right length.
    for (let q = pottsParams.q.min; q <= pottsParams.q.max; q++) {
      const params = { ...defaultParams(pottsParams), side: 32, q };
      const state = pottsSimulation.create(params, 1);
      const table = colorTable(pottsPainter.colors(palette("viridis"), state));
      expect(new Set(table).size, `q = ${q}`).toBe(q);
      const pixels = new Uint32Array(32 * 32);
      pottsPainter.paint(state, pixels, table);
      expect(
        pixels.every((pixel) => table.includes(pixel)),
        `q = ${q}`,
      ).toBe(true);
    }
  });
});
