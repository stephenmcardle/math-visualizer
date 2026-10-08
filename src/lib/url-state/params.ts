/**
 * Parameter schemas and their URL (query string) representation.
 *
 * Each visualization declares its user-configurable parameters as a schema.
 * The schema drives three things: the typed parameter object passed to the
 * simulation, the generic slider controls, and URL parsing/serialization.
 * Everything here is pure so it can be unit tested without a browser.
 */

import { MAX_SEED } from "@/lib/random/prng";

export interface NumberParamSpec {
  label: string;
  description?: string;
  min: number;
  max: number;
  /** Values are snapped to this grid, so `step: 1` makes an integer parameter. */
  step: number;
  default: number;
  /** Optional unit/suffix shown next to the value, e.g. "px" or "steps/s". */
  unit?: string;
  /**
   * `true` if changing this parameter should apply to the running simulation
   * instead of restarting it from the seed (e.g. speed).
   */
  live?: boolean;
}

export type ParamSchema = Record<string, NumberParamSpec>;

export type ParamValues<S extends ParamSchema> = { [K in keyof S]: number };

/** Query-string key reserved for the seed; schemas may not use it. */
export const SEED_KEY = "seed";

function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** Clamp to [min, max] and snap to the step grid anchored at `min`. */
export function normalizeParam(spec: NumberParamSpec, value: number): number {
  if (!Number.isFinite(value)) return spec.default;
  const clamped = Math.min(spec.max, Math.max(spec.min, value));
  const snapped = spec.min + Math.round((clamped - spec.min) / spec.step) * spec.step;
  // Snapping can overshoot max by a float hair, and `0.1 * 3` style noise
  // would leak into the URL, so round to the step's precision.
  const bounded = Math.min(spec.max, snapped);
  return Number(bounded.toFixed(decimalsOf(spec.step)));
}

export function defaultParams<S extends ParamSchema>(schema: S): ParamValues<S> {
  const values = {} as Record<string, number>;
  for (const key of Object.keys(schema)) values[key] = schema[key].default;
  return values as ParamValues<S>;
}

/** Read params from a query string. Missing or invalid values fall back to defaults. */
export function parseParams<S extends ParamSchema>(
  schema: S,
  search: URLSearchParams,
): ParamValues<S> {
  const values = {} as Record<string, number>;
  for (const key of Object.keys(schema)) {
    const spec = schema[key];
    const raw = search.get(key);
    const parsed = raw === null || raw.trim() === "" ? Number.NaN : Number(raw);
    values[key] = normalizeParam(spec, parsed);
  }
  return values as ParamValues<S>;
}

/** Parse a seed, returning `null` when absent or invalid so callers can pick one. */
export function parseSeed(search: URLSearchParams): number | null {
  const raw = search.get(SEED_KEY);
  if (raw === null || !/^\d{1,10}$/.test(raw)) return null;
  const seed = Number(raw);
  return seed <= MAX_SEED ? seed : null;
}

/**
 * Serialize params and seed. Every param is written (not just non-defaults) so
 * a shared link keeps its meaning even if a default changes later.
 */
export function serializeParams<S extends ParamSchema>(
  schema: S,
  values: ParamValues<S>,
  seed: number,
): URLSearchParams {
  const search = new URLSearchParams();
  for (const key of Object.keys(schema)) {
    search.set(key, String(normalizeParam(schema[key], values[key])));
  }
  search.set(SEED_KEY, String(seed));
  return search;
}
