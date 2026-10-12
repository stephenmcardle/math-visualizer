import { SEED_KEY, type ParamSchema, type ParamSpec } from "@/lib/url-state/params";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";

export interface VisualizationRegistry {
  list(): readonly AnyVisualizationDefinition[];
  get(slug: string): AnyVisualizationDefinition | undefined;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Enum values appear in URLs, so keep them to the same safe alphabet as slugs. */
const ENUM_VALUE_PATTERN = SLUG_PATTERN;

function validateParam(where: string, spec: ParamSpec): string[] {
  switch (spec.type) {
    case "boolean":
      return typeof spec.default === "boolean" ? [] : [`${where} default must be true or false`];
    case "enum": {
      const problems: string[] = [];
      const values = spec.options.map((option) => option.value);
      if (values.length < 2) problems.push(`${where} needs at least two options`);
      if (new Set(values).size !== values.length) problems.push(`${where} has duplicate options`);
      for (const value of values) {
        if (!ENUM_VALUE_PATTERN.test(value)) {
          problems.push(`${where} option "${value}" must be lowercase kebab-case`);
        }
      }
      if (!values.includes(spec.default)) {
        problems.push(`${where} default "${spec.default}" is not one of its options`);
      }
      return problems;
    }
    default: {
      const problems: string[] = [];
      if (!(spec.min < spec.max)) problems.push(`${where} needs min < max`);
      if (!(spec.step > 0)) problems.push(`${where} needs step > 0`);
      if (spec.default < spec.min || spec.default > spec.max) {
        problems.push(`${where} default ${spec.default} is outside [${spec.min}, ${spec.max}]`);
      }
      return problems;
    }
  }
}

/** Returns a list of problems with a definition; empty when valid. */
export function validateDefinition(definition: AnyVisualizationDefinition): string[] {
  const { slug } = definition.metadata;
  const problems: string[] = [];
  if (!SLUG_PATTERN.test(slug)) problems.push(`slug "${slug}" must be lowercase kebab-case`);

  const params: ParamSchema = definition.params;
  for (const [key, spec] of Object.entries(params)) {
    const where = `${slug}: param "${key}"`;
    if (key === SEED_KEY) problems.push(`${where} uses the reserved key "${SEED_KEY}"`);
    problems.push(...validateParam(where, spec));
  }
  return problems;
}

/**
 * Build a registry from an explicit list of definitions. Throws on invalid or
 * duplicate definitions so mistakes surface in tests and at build time.
 */
export function createRegistry(
  definitions: readonly AnyVisualizationDefinition[],
): VisualizationRegistry {
  const bySlug = new Map<string, AnyVisualizationDefinition>();
  for (const definition of definitions) {
    const problems = validateDefinition(definition);
    if (problems.length > 0) {
      throw new Error(`Invalid visualization definition:\n- ${problems.join("\n- ")}`);
    }
    const { slug } = definition.metadata;
    if (bySlug.has(slug)) throw new Error(`Duplicate visualization slug "${slug}"`);
    bySlug.set(slug, definition);
  }
  const list = [...bySlug.values()];
  return {
    list: () => list,
    get: (slug) => bySlug.get(slug),
  };
}
