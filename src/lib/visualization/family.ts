import type { AnyVisualizationDefinition, VisualizationMetadata } from "@/lib/visualization/types";

/**
 * Every page in `slug`'s family, itself included, in registry order (ADR 0014).
 * Empty when it has no family or is the only member, so there is nothing to switch to.
 */
export function familyMembers(
  definitions: readonly AnyVisualizationDefinition[],
  slug: string,
): VisualizationMetadata[] {
  const family = definitions.find((d) => d.metadata.slug === slug)?.metadata.family;
  if (!family) return [];
  const members = definitions.filter((d) => d.metadata.family === family).map((d) => d.metadata);
  return members.length > 1 ? members : [];
}
