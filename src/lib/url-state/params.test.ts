import { describe, expect, it } from "vitest";

import {
  defaultParams,
  normalizeParam,
  parseParams,
  parseSeed,
  serializeParams,
  type ParamSchema,
} from "@/lib/url-state/params";

const schema = {
  walkers: { label: "Walkers", min: 1, max: 2000, step: 1, default: 100 },
  stepSize: { label: "Step size", min: 0.5, max: 20, step: 0.5, default: 3 },
  rate: { label: "Rate", min: 0, max: 1, step: 0.1, default: 0.3 },
} satisfies ParamSchema;

describe("parseParams", () => {
  it("uses defaults for an empty query", () => {
    expect(parseParams(schema, new URLSearchParams())).toEqual(defaultParams(schema));
  });

  it("reads valid values", () => {
    const parsed = parseParams(schema, new URLSearchParams("walkers=250&stepSize=2.5&rate=0.7"));
    expect(parsed).toEqual({ walkers: 250, stepSize: 2.5, rate: 0.7 });
  });

  it("falls back to defaults for invalid values", () => {
    const parsed = parseParams(schema, new URLSearchParams("walkers=lots&stepSize=&rate=NaN"));
    expect(parsed).toEqual(defaultParams(schema));
  });

  it("clamps to range and snaps to the step grid", () => {
    const parsed = parseParams(schema, new URLSearchParams("walkers=99999&stepSize=2.7&rate=-4"));
    expect(parsed).toEqual({ walkers: 2000, stepSize: 2.5, rate: 0 });
  });

  it("ignores unknown keys", () => {
    const parsed = parseParams(schema, new URLSearchParams("walkers=5&color=red"));
    expect(parsed.walkers).toBe(5);
    expect(parsed).not.toHaveProperty("color");
  });
});

describe("normalizeParam", () => {
  it("avoids floating point noise from snapping", () => {
    expect(normalizeParam(schema.rate, 0.30000000000000004)).toBe(0.3);
    expect(normalizeParam(schema.rate, 0.7)).toBe(0.7);
  });
});

describe("parseSeed", () => {
  it.each([
    ["seed=12345", 12345],
    ["seed=0", 0],
    ["seed=4294967295", 4294967295],
  ])("parses %s", (query, expected) => {
    expect(parseSeed(new URLSearchParams(query))).toBe(expected);
  });

  it.each(["", "seed=", "seed=-1", "seed=1.5", "seed=abc", "seed=4294967296", "seed=1e3"])(
    "rejects %j",
    (query) => {
      expect(parseSeed(new URLSearchParams(query))).toBeNull();
    },
  );
});

describe("serializeParams", () => {
  it("writes every param and the seed", () => {
    const query = serializeParams(schema, { walkers: 100, stepSize: 2, rate: 0.3 }, 12345);
    expect(query.toString()).toBe("walkers=100&stepSize=2&rate=0.3&seed=12345");
  });

  it("round-trips through parse", () => {
    const values = { walkers: 512, stepSize: 7.5, rate: 0.9 };
    const query = serializeParams(schema, values, 77);
    expect(parseParams(schema, query)).toEqual(values);
    expect(parseSeed(query)).toBe(77);
  });
});
