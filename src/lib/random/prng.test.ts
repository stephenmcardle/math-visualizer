import { describe, expect, it } from "vitest";

import { createRng, MAX_SEED, nextFloat, nextInt, nextUint32 } from "@/lib/random/prng";

const take = (seed: number, count: number) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => nextUint32(rng));
};

describe("prng", () => {
  it("produces the same sequence for the same seed", () => {
    expect(take(42, 1000)).toEqual(take(42, 1000));
  });

  it("produces different sequences for different seeds", () => {
    expect(take(1, 10)).not.toEqual(take(2, 10));
  });

  // Pinned outputs (checked against the reference sfc32/splitmix32 JS). If
  // these change, every shared URL replays differently, so treat a failure
  // here as a breaking change.
  it("matches pinned reference outputs", () => {
    expect(take(0, 5)).toEqual([548183886, 1097162541, 2219297441, 1664216021, 3479288465]);
    expect(take(12345, 5)).toEqual([2142345551, 3083893245, 1997626643, 3123200824, 1123390551]);
  });

  it("keeps its state as plain cloneable data", () => {
    const rng = createRng(7);
    nextUint32(rng);
    const copy = structuredClone(rng);
    expect(Array.from({ length: 5 }, () => nextUint32(copy))).toEqual(
      Array.from({ length: 5 }, () => nextUint32(rng)),
    );
  });

  it("returns floats in [0, 1) and ints in range", () => {
    const rng = createRng(99);
    let sum = 0;
    for (let i = 0; i < 100_000; i++) {
      const f = nextFloat(rng);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      sum += f;
      const n = nextInt(rng, 6);
      expect(Number.isInteger(n) && n >= 0 && n < 6).toBe(true);
    }
    expect(sum / 100_000).toBeCloseTo(0.5, 2);
  });

  it("rejects seeds outside the 32-bit unsigned range", () => {
    expect(() => createRng(-1)).toThrow(RangeError);
    expect(() => createRng(MAX_SEED + 1)).toThrow(RangeError);
    expect(() => createRng(1.5)).toThrow(RangeError);
    expect(() => createRng(MAX_SEED)).not.toThrow();
  });
});
