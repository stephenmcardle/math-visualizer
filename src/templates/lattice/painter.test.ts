import { describe, expect, it } from "vitest";

import { colorTable, packPixel } from "@/templates/lattice/painter";

describe("lattice colors", () => {
  it("packs 0xRRGGBB as opaque little-endian RGBA", () => {
    const bytes = new Uint8Array(Uint32Array.of(packPixel(0x112233)).buffer);
    expect(Array.from(bytes)).toEqual([0x11, 0x22, 0x33, 0xff]);
  });

  it("packs one pixel per color, in order", () => {
    expect(Array.from(colorTable([0xff0000, 0x0000ff]))).toEqual([
      packPixel(0xff0000),
      packPixel(0x0000ff),
    ]);
  });
});
