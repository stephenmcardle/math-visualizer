import type { Difficulty, VisualizationMetadata } from "@/lib/visualization/types";

/** Home page filters; null means "any". Stored in the query string as `category`, `difficulty`, `tag`. */
export interface VisualizationFilters {
  category: string | null;
  difficulty: Difficulty | null;
  tag: string | null;
}

export interface FilterOptions {
  categories: string[];
  difficulties: Difficulty[];
  tags: string[];
}

export const NO_FILTERS: VisualizationFilters = { category: null, difficulty: null, tag: null };

const DIFFICULTY_ORDER: readonly Difficulty[] = ["introductory", "intermediate", "advanced"];

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

/** The values that occur in `items`, so every option matches at least one visualization. */
export function filterOptions(items: readonly VisualizationMetadata[]): FilterOptions {
  const difficulties = new Set(items.map((item) => item.difficulty));
  return {
    categories: sortedUnique(items.map((item) => item.category)),
    difficulties: DIFFICULTY_ORDER.filter((difficulty) => difficulties.has(difficulty)),
    tags: sortedUnique(items.flatMap((item) => item.tags)),
  };
}

export function matchesFilters(
  item: VisualizationMetadata,
  filters: VisualizationFilters,
): boolean {
  return (
    (filters.category === null || item.category === filters.category) &&
    (filters.difficulty === null || item.difficulty === filters.difficulty) &&
    (filters.tag === null || item.tags.includes(filters.tag))
  );
}

/** Reads filters from a query string; values that aren't options are ignored. */
export function parseFilters(
  search: URLSearchParams,
  options: FilterOptions,
): VisualizationFilters {
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | null => {
    const value = search.get(key);
    return allowed.find((option) => option === value) ?? null;
  };
  return {
    category: pick("category", options.categories),
    difficulty: pick("difficulty", options.difficulties),
    tag: pick("tag", options.tags),
  };
}

/** Only the active filters, so an unfiltered home page keeps a clean URL. */
export function serializeFilters(filters: VisualizationFilters): URLSearchParams {
  const search = new URLSearchParams();
  if (filters.category !== null) search.set("category", filters.category);
  if (filters.difficulty !== null) search.set("difficulty", filters.difficulty);
  if (filters.tag !== null) search.set("tag", filters.tag);
  return search;
}
