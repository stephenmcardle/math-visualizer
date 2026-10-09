/**
 * Parameter schemas and their URL (query string) representation.
 *
 * Each visualization declares its user-configurable parameters as a schema.
 * The schema drives three things: the typed parameter object passed to the
 * simulation, the generated controls (slider, switch or select), and URL
 * parsing/serialization.
 * Everything here is pure so it can be unit tested without a browser.
 */

import { MAX_SEED } from "@/lib/random/prng";

interface BaseParamSpec {
  label: string;
  description?: string;
  /**
   * `true` if changing this parameter should apply to the running simulation
   * instead of restarting it from the seed (e.g. speed).
   */
  live?: boolean;
}

export interface NumberParamSpec extends BaseParamSpec {
  /** Optional so that existing numeric schemas need no change. */
  type?: "number";
  min: number;
  max: number;
  /** Values are snapped to this grid, so `step: 1` makes an integer parameter. */
  step: number;
  default: number;
  /** Optional unit/suffix shown next to the value, e.g. "px" or "steps/s". */
  unit?: string;
}

/** An on/off switch. Serialized as `1` / `0`. */
export interface BooleanParamSpec extends BaseParamSpec {
  type: "boolean";
  default: boolean;
}

/** One of a fixed set of values. Each `value` appears in URLs, so keep it short and stable. */
export interface EnumParamSpec extends BaseParamSpec {
  type: "enum";
  options: readonly { value: string; label: string }[];
  default: string;
}

export type ParamSpec = NumberParamSpec | BooleanParamSpec | EnumParamSpec;

export type ParamSchema = Record<string, ParamSpec>;

export type ParamValue = number | boolean | string;

type ValueOf<P extends ParamSpec> = P extends BooleanParamSpec
  ? boolean
  : P extends EnumParamSpec
    ? string
    : number;

export type ParamValues<S extends ParamSchema> = { [K in keyof S]: ValueOf<S[K]> };

/** Query-string key reserved for the seed; schemas may not use it. */
export const SEED_KEY = "seed";

function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** Clamp to [min, max] and snap to the step grid anchored at `min`. */
function normalizeNumber(spec: NumberParamSpec, value: number): number {
  if (!Number.isFinite(value)) return spec.default;
  const clamped = Math.min(spec.max, Math.max(spec.min, value));
  const snapped = spec.min + Math.round((clamped - spec.min) / spec.step) * spec.step;
  // Snapping can overshoot max by a float hair, and `0.1 * 3` style noise
  // would leak into the URL, so round to the step's precision.
  const bounded = Math.min(spec.max, snapped);
  return Number(bounded.toFixed(decimalsOf(spec.step)));
}

/**
 * Coerce a value to something valid for `spec`: numbers are clamped and
 * snapped, and a value of the wrong type or an unknown option gives the default.
 */
export function normalizeParam(spec: NumberParamSpec, value: ParamValue): number;
export function normalizeParam(spec: ParamSpec, value: ParamValue): ParamValue;
export function normalizeParam(spec: ParamSpec, value: ParamValue): ParamValue {
  switch (spec.type) {
    case "boolean":
      return typeof value === "boolean" ? value : spec.default;
    case "enum":
      return spec.options.some((option) => option.value === value) ? value : spec.default;
    default:
      return typeof value === "number" ? normalizeNumber(spec, value) : spec.default;
  }
}

/** Decode one query-string value; `null` (missing) or garbage gives the default. */
function parseParamValue(spec: ParamSpec, raw: string | null): ParamValue {
  if (raw === null || raw.trim() === "") return spec.default;
  switch (spec.type) {
    case "boolean":
      if (raw === "1" || raw === "true") return true;
      if (raw === "0" || raw === "false") return false;
      return spec.default;
    case "enum":
      return normalizeParam(spec, raw);
    default:
      return normalizeNumber(spec, Number(raw));
  }
}

function formatParamValue(spec: ParamSpec, value: ParamValue): string {
  const normalized = normalizeParam(spec, value);
  if (spec.type === "boolean") return normalized ? "1" : "0";
  return String(normalized);
}

export function defaultParams<S extends ParamSchema>(schema: S): ParamValues<S> {
  const values = {} as Record<string, ParamValue>;
  for (const key of Object.keys(schema)) values[key] = schema[key].default;
  return values as ParamValues<S>;
}

/** Read params from a query string. Missing or invalid values fall back to defaults. */
export function parseParams<S extends ParamSchema>(
  schema: S,
  search: URLSearchParams,
): ParamValues<S> {
  const values = {} as Record<string, ParamValue>;
  for (const key of Object.keys(schema)) {
    values[key] = parseParamValue(schema[key], search.get(key));
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
    search.set(key, formatParamValue(schema[key], values[key]));
  }
  search.set(SEED_KEY, String(seed));
  return search;
}
