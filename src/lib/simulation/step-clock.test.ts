import { describe, expect, it } from "vitest";

import { StepClock } from "@/lib/simulation/step-clock";

describe("StepClock", () => {
  it("returns 0 on the first tick, then steps proportional to elapsed time", () => {
    const clock = new StepClock();
    expect(clock.tick(0, 60)).toBe(0);
    expect(clock.tick(100, 60)).toBe(6);
  });

  it("carries fractional steps across frames", () => {
    const clock = new StepClock();
    clock.tick(0, 10);
    // 16ms at 10 steps/s = 0.16 steps per frame; the 7th frame crosses 1.
    const steps = Array.from({ length: 7 }, (_, i) => clock.tick((i + 1) * 16, 10));
    expect(steps.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("caps steps per frame and clamps long gaps", () => {
    const clock = new StepClock(5);
    clock.tick(0, 1000);
    expect(clock.tick(10_000, 1000)).toBe(5);
    expect(clock.tick(10_001, 1000)).toBe(1);
  });
});
