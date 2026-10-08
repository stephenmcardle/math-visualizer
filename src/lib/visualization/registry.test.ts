import { describe, expect, it } from "vitest";

import { createRegistry, validateDefinition } from "@/lib/visualization/registry";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";
import { randomWalk } from "@/visualizations/random-walk/definition";
import { visualizations } from "@/visualizations/registry";
import { workerSimulations } from "@/workers/simulations";

function withSlug(slug: string): AnyVisualizationDefinition {
  return { ...randomWalk, metadata: { ...randomWalk.metadata, slug } };
}

function withParam(key: string, spec: object): AnyVisualizationDefinition {
  return {
    ...randomWalk,
    params: { [key]: { label: key, min: 0, max: 10, step: 1, default: 5, ...spec } },
  };
}

describe("app registry", () => {
  it("includes the random walk", () => {
    expect(visualizations.get("random-walk")).toBe(randomWalk);
  });

  it("registers a worker simulation for every worker-executed visualization", () => {
    for (const definition of visualizations.list()) {
      if (definition.execution === "worker") {
        expect(workerSimulations[definition.metadata.slug]).toBeDefined();
      }
    }
  });
});

describe("createRegistry", () => {
  it("lists definitions in registration order and looks them up by slug", () => {
    const registry = createRegistry([withSlug("b-viz"), withSlug("a-viz")]);
    expect(registry.list().map((d) => d.metadata.slug)).toEqual(["b-viz", "a-viz"]);
    expect(registry.get("a-viz")?.metadata.slug).toBe("a-viz");
    expect(registry.get("missing")).toBeUndefined();
  });

  it("rejects duplicate slugs", () => {
    expect(() => createRegistry([withSlug("same"), withSlug("same")])).toThrow(/Duplicate/);
  });

  it("rejects invalid definitions", () => {
    expect(() => createRegistry([withSlug("Not A Slug")])).toThrow(/kebab-case/);
  });
});

describe("validateDefinition", () => {
  it("accepts the random walk", () => {
    expect(validateDefinition(randomWalk)).toEqual([]);
  });

  it("reserves the seed key", () => {
    expect(validateDefinition(withParam("seed", {}))).toEqual([
      expect.stringContaining("reserved"),
    ]);
  });

  it("checks ranges, steps and defaults", () => {
    expect(validateDefinition(withParam("p", { min: 5, max: 5 }))).toEqual([
      expect.stringContaining("min < max"),
    ]);
    expect(validateDefinition(withParam("p", { step: 0 }))).toEqual([
      expect.stringContaining("step > 0"),
    ]);
    expect(validateDefinition(withParam("p", { default: 11 }))).toEqual([
      expect.stringContaining("outside"),
    ]);
  });
});
