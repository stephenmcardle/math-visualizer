import type { MDXContent } from "mdx/types";

import type { RendererBinding } from "@/lib/rendering/types";
import type { Simulation } from "@/lib/simulation/types";
import type { ParamSchema, ParamValues } from "@/lib/url-state/params";

export type Difficulty = "introductory" | "intermediate" | "advanced";

/** A source a visualization is based on. Only list sources you have actually used. */
export interface Reference {
  title: string;
  authors?: string;
  year?: number;
  /** Prefer a DOI or arXiv link. */
  url?: string;
  note?: string;
}

export interface VisualizationMetadata {
  /** URL segment: /visualizations/<slug>. Lowercase kebab-case. */
  slug: string;
  title: string;
  /** One or two sentences, shown on cards and as the page description. */
  description: string;
  /** Broad mathematical area, e.g. "Probability", "Dynamical systems". */
  category: string;
  difficulty: Difficulty;
  tags: string[];
  relatedConcepts: string[];
  references: Reference[];
}

export interface VisualizationDefinition<S extends ParamSchema, TState> {
  metadata: VisualizationMetadata;
  /** User-configurable parameters; drives controls and the URL query string. */
  params: S;
  simulation: Simulation<ParamValues<S>, TState>;
  /** Simulation steps per second of wall-clock time while playing. */
  stepsPerSecond(params: ParamValues<S>): number;
  /**
   * Where `simulation.step` runs. "worker" requires registering the simulation
   * in `src/workers/simulations.ts`.
   */
  execution: "main" | "worker";
  renderer: RendererBinding<ParamValues<S>, TState>;
  /** Optional long-form MDX explanation, loaded at build time on the visualization page. */
  explanation?: () => Promise<{ default: MDXContent }>;
}

/** Identity helper that infers the param and state types of a definition. */
export function defineVisualization<S extends ParamSchema, TState>(
  definition: VisualizationDefinition<S, TState>,
): VisualizationDefinition<S, TState> {
  return definition;
}

// The registry and host treat definitions generically; the concrete param and
// state types only matter inside each visualization's own module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyVisualizationDefinition = VisualizationDefinition<any, any>;
