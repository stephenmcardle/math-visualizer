import { describe, expect, it } from "vitest";

import { expNegative } from "@/lib/math/deterministic";

describe("expNegative", () => {
  it("matches Math.exp over the range the simulations use", () => {
    for (let x = 0; x <= 16; x += 0.01) {
      expect(Math.abs(expNegative(x) / Math.exp(-x) - 1)).toBeLessThan(1e-13);
    }
  });
});
