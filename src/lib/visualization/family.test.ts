import { describe, expect, it } from "vitest";

import type { ParamSpec } from "@/lib/url-state/params";
import { familyMembers } from "@/lib/visualization/family";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";
import { randomWalk } from "@/visualizations/random-walk/definition";
import { visualizations } from "@/visualizations/registry";

function page(slug: string, family?: string): AnyVisualizationDefinition {
  return { ...randomWalk, metadata: { ...randomWalk.metadata, slug, family } };
}

/** What a shared key must agree on for its value to mean the same on both pages. */
function meaning(spec: ParamSpec): unknown {
  switch (spec.type) {
    case "boolean":
      return "boolean";
    case "enum":
      return spec.options.map((option) => option.value);
    default:
      return [spec.min, spec.max, spec.step];
  }
}

describe("familyMembers", () => {
  const list = [page("a", "Walks"), page("b"), page("c", "Walks"), page("d", "Solo")];

  it("lists the family in registry order, including the page itself", () => {
    expect(familyMembers(list, "c").map((m) => m.slug)).toEqual(["a", "c"]);
  });

  it("is empty without a family, for a family of one, or for an unknown slug", () => {
    expect(familyMembers(list, "b")).toEqual([]);
    expect(familyMembers(list, "d")).toEqual([]);
    expect(familyMembers(list, "missing")).toEqual([]);
  });
});

describe("registered families", () => {
  it("give params shared within a family the same type and range", () => {
    // The switcher carries shared keys over, so a shared key must mean the same on both pages.
    for (const a of visualizations.list()) {
      for (const b of familyMembers(visualizations.list(), a.metadata.slug)) {
        const other = visualizations.get(b.slug)!;
        for (const key of Object.keys(a.params)) {
          if (!(key in other.params)) continue;
          const where = `${a.metadata.slug} and ${b.slug}: "${key}"`;
          expect(meaning(other.params[key]), where).toEqual(meaning(a.params[key]));
        }
      }
    }
  });
});
