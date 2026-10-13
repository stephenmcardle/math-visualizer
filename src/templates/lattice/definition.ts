import type { MDXContent } from "mdx/types";

import type { PixiRendererFactory } from "@/lib/rendering/types";
import type { NumberParamSpec, ParamSchema, ParamValues } from "@/lib/url-state/params";
import {
  defineVisualization,
  type VisualizationDefinition,
  type VisualizationMetadata,
} from "@/lib/visualization/types";
import type { LatticeState } from "@/templates/lattice/simulation";
import type { Simulation } from "@/lib/simulation/types";

/**
 * A lattice model's definition. Every lattice model runs in the worker, is
 * drawn by Pixi and plays `speed` sweeps per second, so only these vary.
 */
export function defineLatticeVisualization<
  S extends ParamSchema & { speed: NumberParamSpec },
  M,
>(spec: {
  metadata: VisualizationMetadata;
  params: S;
  simulation: Simulation<ParamValues<S>, LatticeState<M>>;
  /** Lazy import of the model's renderer, so Pixi loads only on its page. */
  renderer: () => Promise<PixiRendererFactory<ParamValues<S>, LatticeState<M>>>;
  describe(state: LatticeState<M>, params: ParamValues<S>): string;
  explanation: () => Promise<{ default: MDXContent }>;
}): VisualizationDefinition<S, LatticeState<M>> {
  return defineVisualization({
    metadata: spec.metadata,
    params: spec.params,
    simulation: spec.simulation,
    // One step is one sweep of the whole lattice: up to 512² attempts.
    stepsPerSecond: (params) => params.speed,
    execution: "worker",
    renderer: { engine: "pixi", load: spec.renderer },
    describe: spec.describe,
    explanation: spec.explanation,
  });
}
