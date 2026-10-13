import { describe, expect, it } from "vitest";

import { bisect, cosTurns, expNegative, sinTurns, sinhPositive } from "@/lib/math/deterministic";

describe("expNegative", () => {
  it("matches Math.exp over the range the simulations use", () => {
    for (let x = 0; x <= 16; x += 0.01) {
      expect(Math.abs(expNegative(x) / Math.exp(-x) - 1)).toBeLessThan(1e-13);
    }
  });
});

describe("sinhPositive", () => {
  it("matches Math.sinh", () => {
    for (let x = 0.01; x <= 12; x += 0.01) {
      expect(Math.abs(sinhPositive(x) / Math.sinh(x) - 1)).toBeLessThan(1e-13);
    }
  });
});

describe("bisect", () => {
  it("finds the root of an increasing function to the last bit", () => {
    expect(bisect((x) => x * x - 2, 0, 2)).toBeCloseTo(Math.SQRT2, 15);
  });
});

describe("cosTurns and sinTurns", () => {
  it("match Math.cos and Math.sin, for any number of turns", () => {
    // 4e-15 rather than 1e-15: Math.cos itself loses that much rounding 2πt for |t| up to 3.
    for (let t = -3; t <= 3; t += 0.0009765) {
      expect(Math.abs(cosTurns(t) - Math.cos(2 * Math.PI * t))).toBeLessThan(4e-15);
      expect(Math.abs(sinTurns(t) - Math.sin(2 * Math.PI * t))).toBeLessThan(4e-15);
    }
  });

  it("are exact at whole quarter turns", () => {
    // `+ 0` turns −0 into 0; the sign of zero doesn't matter here.
    expect([0, 0.25, 0.5, 0.75, 1].map((t) => cosTurns(t) + 0)).toEqual([1, 0, -1, 0, 1]);
    expect([0, 0.25, 0.5, 0.75, 1].map((t) => sinTurns(t) + 0)).toEqual([0, 1, 0, -1, 0]);
  });
});
