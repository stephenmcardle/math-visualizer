import { describe, expect, it } from "vitest";

import { ANGLE_STEPS, COS, SIN, angleDifference } from "@/lib/math/angles";

describe("quantized angles", () => {
  it("tabulate cos and sin of every step", () => {
    for (let i = 0; i < ANGLE_STEPS; i += 97) {
      const angle = (2 * Math.PI * i) / ANGLE_STEPS;
      expect(Math.abs(COS[i] - Math.cos(angle))).toBeLessThan(1e-15);
      expect(Math.abs(SIN[i] - Math.sin(angle))).toBeLessThan(1e-15);
    }
    expect([COS[0], SIN[ANGLE_STEPS / 4], COS[ANGLE_STEPS / 2]]).toEqual([1, 1, -1]);
  });

  it("wrap differences the shorter way round", () => {
    expect(angleDifference(10, 30)).toBe(20);
    expect(angleDifference(30, 10)).toBe(-20);
    expect(angleDifference(65530, 4)).toBe(10);
    expect(angleDifference(4, 65530)).toBe(-10);
  });
});
