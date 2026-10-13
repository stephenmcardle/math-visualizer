import { describe, expect, it, vi } from "vitest";

const { cosTurns } = vi.hoisted(() => ({ cosTurns: vi.fn<(t: number) => number>() }));

vi.mock("@/lib/math/deterministic", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/math/deterministic")>();
  cosTurns.mockImplementation(original.cosTurns);
  return { ...original, cosTurns };
});

describe("page startup", () => {
  it("builds the angle tables only when a model first needs them", async () => {
    // Every page imports the registry, and only XY and O(3) use the tables.
    await import("@/visualizations/registry");
    expect(cosTurns).not.toHaveBeenCalled();
    const { angleTables } = await import("@/lib/math/angles");
    expect(angleTables()).toBe(angleTables());
    expect(cosTurns).toHaveBeenCalledTimes(65536);
  });
});
