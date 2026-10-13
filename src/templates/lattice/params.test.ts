import { describe, expect, it } from "vitest";

import { paletteParam } from "@/lib/rendering/palettes";
import { latticeParams } from "@/templates/lattice/params";
import { isingParams } from "@/visualizations/ising-model/params";

describe("latticeParams", () => {
  it("puts grid size first and speed and palette last", () => {
    const params = latticeParams({ q: { label: "States", min: 2, max: 10, step: 1, default: 3 } });
    expect(Object.keys(params)).toEqual(["side", "q", "speed", "palette"]);
    expect(params.palette).toBe(paletteParam);
  });

  it("keeps the Ising model's URL keys and ranges, so old links still parse the same", () => {
    expect(Object.keys(isingParams)).toEqual(["side", "temperature", "start", "speed", "palette"]);
    const { side, speed } = isingParams;
    expect([side.min, side.max, side.step, side.default]).toEqual([32, 512, 32, 128]);
    expect([speed.min, speed.max, speed.step, speed.default, speed.live]).toEqual([
      1,
      100,
      1,
      30,
      true,
    ]);
  });
});
