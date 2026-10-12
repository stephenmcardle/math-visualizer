import { describe, expect, it } from "vitest";

import {
  filterOptions,
  matchesFilters,
  NO_FILTERS,
  parseFilters,
  serializeFilters,
} from "@/lib/visualization/filter";
import type { VisualizationMetadata } from "@/lib/visualization/types";

function item(
  slug: string,
  category: string,
  difficulty: VisualizationMetadata["difficulty"],
  tags: string[],
): VisualizationMetadata {
  return {
    slug,
    title: slug,
    description: "",
    category,
    difficulty,
    tags,
    relatedConcepts: [],
    references: [],
  };
}

const items = [
  item("walk", "Probability", "introductory", ["random walk", "diffusion"]),
  item("perc", "Probability", "intermediate", ["phase transition"]),
  item("ising", "Statistical mechanics", "intermediate", ["phase transition", "Markov chain"]),
  item("lorenz", "Dynamical systems", "intermediate", ["chaos", "3D"]),
];
const options = filterOptions(items);

describe("filterOptions", () => {
  it("lists values that occur, sorted, with difficulties in their natural order", () => {
    expect(options.categories).toEqual([
      "Dynamical systems",
      "Probability",
      "Statistical mechanics",
    ]);
    expect(options.difficulties).toEqual(["introductory", "intermediate"]);
    expect(options.tags).toEqual([
      "3D",
      "chaos",
      "diffusion",
      "Markov chain",
      "phase transition",
      "random walk",
    ]);
  });
});

describe("matchesFilters", () => {
  const slugs = (filters: typeof NO_FILTERS) =>
    items.filter((i) => matchesFilters(i, filters)).map((i) => i.slug);

  it("matches everything without filters and combines filters with AND", () => {
    expect(slugs(NO_FILTERS)).toEqual(["walk", "perc", "ising", "lorenz"]);
    expect(slugs({ ...NO_FILTERS, tag: "phase transition" })).toEqual(["perc", "ising"]);
    expect(slugs({ ...NO_FILTERS, tag: "phase transition", category: "Probability" })).toEqual([
      "perc",
    ]);
    expect(
      slugs({ ...NO_FILTERS, difficulty: "introductory", category: "Dynamical systems" }),
    ).toEqual([]);
  });
});

describe("parseFilters / serializeFilters", () => {
  it("round-trips, writing only active filters", () => {
    const filters = { category: "Statistical mechanics", difficulty: null, tag: "3D" } as const;
    const query = serializeFilters(filters);
    expect(query.toString()).toBe("category=Statistical+mechanics&tag=3D");
    expect(parseFilters(query, options)).toEqual(filters);
    expect(serializeFilters(NO_FILTERS).toString()).toBe("");
  });

  it("ignores values that aren't options", () => {
    const query = new URLSearchParams("category=Topology&difficulty=easy&tag=chaos");
    expect(parseFilters(query, options)).toEqual({ ...NO_FILTERS, tag: "chaos" });
  });
});
