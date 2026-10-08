"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { randomSeed } from "@/lib/random/prng";
import {
  normalizeParam,
  parseParams,
  parseSeed,
  serializeParams,
  type ParamSchema,
  type ParamValues,
} from "@/lib/url-state/params";

const URL_WRITE_DELAY_MS = 250;

export interface VisualizationUrlState<S extends ParamSchema> {
  params: ParamValues<S>;
  seed: number;
  setParam: (key: keyof S & string, value: number) => void;
  setSeed: (seed: number) => void;
}

/**
 * Params + seed, initialized from the query string and written back to it.
 *
 * React state is the source of truth while the page is open; the URL is a
 * debounced mirror updated with `replaceState`, so dragging a slider neither
 * spams browser history nor triggers a Next.js navigation. Must be rendered
 * inside a `<Suspense>` boundary because it reads `useSearchParams`.
 */
export function useVisualizationUrlState<S extends ParamSchema>(
  schema: S,
): VisualizationUrlState<S> {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [state, setState] = useState(() => ({
    params: parseParams(schema, searchParams),
    // No seed in the URL: pick one, and the effect below makes it shareable.
    seed: parseSeed(searchParams) ?? randomSeed(),
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = serializeParams(schema, state.params, state.seed).toString();
      window.history.replaceState(window.history.state, "", `${pathname}?${query}`);
    }, URL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [schema, pathname, state]);

  const setParam = useCallback(
    (key: keyof S & string, value: number) => {
      setState((prev) => ({
        ...prev,
        params: { ...prev.params, [key]: normalizeParam(schema[key], value) },
      }));
    },
    [schema],
  );

  const setSeed = useCallback((seed: number) => {
    setState((prev) => ({ ...prev, seed }));
  }, []);

  return { params: state.params, seed: state.seed, setParam, setSeed };
}
