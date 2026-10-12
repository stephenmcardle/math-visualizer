import { describe, expect, it } from "vitest";

import { AutoQuality, detectAutoLevel, qualityProfile } from "@/lib/rendering/quality";

/** Feeds `count` frames `dt` ms apart; returns each level change with its frame number. */
function run(auto: AutoQuality, clock: { now: number }, dt: number, count: number) {
  const changes: { frame: number; level: string }[] = [];
  for (let frame = 1; frame <= count; frame++) {
    clock.now += dt;
    const level = auto.sample(clock.now);
    if (level) changes.push({ frame, level });
  }
  return changes;
}

/** Feeds frames `dt` ms apart until the level changes; returns the new level. */
function runUntilChange(auto: AutoQuality, clock: { now: number }, dt: number): string {
  for (let frame = 0; frame < 100_000; frame++) {
    clock.now += dt;
    const level = auto.sample(clock.now);
    if (level) return level;
  }
  throw new Error("level never changed");
}

const SLOW = 1000 / 30;
const FAST = 1000 / 60;

describe("AutoQuality", () => {
  it("steps down one level after sustained slow frames, and not below low", () => {
    const auto = new AutoQuality("high");
    const clock = { now: 0 };
    const changes = run(auto, clock, SLOW, 400);
    expect(changes.map((c) => c.level)).toEqual(["medium", "low"]);
    expect(changes[0].frame).toBeGreaterThanOrEqual(90);
    expect(auto.level).toBe("low");
  });

  it("steps back up after a long stretch of fast frames", () => {
    const auto = new AutoQuality("high");
    const clock = { now: 0 };
    expect(runUntilChange(auto, clock, SLOW)).toBe("medium");
    // One step down doubles the wait to 1200 fast frames (about 20 s at 60 fps).
    expect(run(auto, clock, FAST, 1150)).toEqual([]);
    expect(run(auto, clock, FAST, 200).map((c) => c.level)).toEqual(["high"]);
  });

  it("steps up despite occasional long frames", () => {
    const auto = new AutoQuality("high");
    const clock = { now: 0 };
    expect(runUntilChange(auto, clock, SLOW)).toBe("medium");
    // Fast frames with a 120 ms hitch (e.g. garbage collection) every 100 frames.
    let level: string | null = null;
    for (let frame = 1; frame <= 3000 && !level; frame++) {
      clock.now += frame % 100 === 0 ? 120 : FAST;
      level = auto.sample(clock.now);
    }
    expect(level).toBe("high");
  });

  it("never goes above the starting level", () => {
    const auto = new AutoQuality("medium");
    expect(run(auto, { now: 0 }, FAST, 20_000)).toEqual([]);
    expect(auto.level).toBe("medium");
  });

  it("waits longer to step up each time it had to step down", () => {
    const auto = new AutoQuality("high");
    const clock = { now: 0 };
    expect(runUntilChange(auto, clock, SLOW)).toBe("medium"); // wait now 1200
    expect(runUntilChange(auto, clock, FAST)).toBe("high");
    expect(runUntilChange(auto, clock, SLOW)).toBe("medium"); // wait now 2400
    expect(run(auto, clock, FAST, 2300)).toEqual([]);
    expect(run(auto, clock, FAST, 200).map((c) => c.level)).toEqual(["high"]);
  });

  it("frames in the gray zone between fast and slow change nothing", () => {
    const auto = new AutoQuality("medium");
    expect(runUntilChange(auto, { now: 0 }, SLOW)).toBe("low");
    expect(run(auto, { now: 1e6 }, 1000 / 45, 20_000)).toEqual([]);
  });

  it("ignores long gaps such as background tabs", () => {
    const auto = new AutoQuality("high");
    expect(run(auto, { now: 0 }, 1000, 500)).toEqual([]);
    expect(auto.level).toBe("high");
  });
});

describe("detectAutoLevel and qualityProfile", () => {
  it("guesses from cores and screen", () => {
    expect(
      detectAutoLevel({ devicePixelRatio: 1, hardwareConcurrency: 4, viewportWidth: 1280 }),
    ).toBe("low");
    expect(
      detectAutoLevel({ devicePixelRatio: 3, hardwareConcurrency: 8, viewportWidth: 390 }),
    ).toBe("medium");
    expect(
      detectAutoLevel({ devicePixelRatio: 2, hardwareConcurrency: 8, viewportWidth: 1280 }),
    ).toBe("high");
  });

  it("caps resolution by level", () => {
    expect(qualityProfile("low", 3).resolution).toBe(1);
    expect(qualityProfile("medium", 3).resolution).toBe(1.5);
    expect(qualityProfile("high", 1.25).resolution).toBe(1.25);
  });
});
