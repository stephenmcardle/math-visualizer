import { defineVisualization } from "@/lib/visualization/types";
import { percolationMetadata } from "@/visualizations/percolation/metadata";
import { percolationParams } from "@/visualizations/percolation/params";
import { percolationSimulation } from "@/visualizations/percolation/simulation";

export const percolation = defineVisualization({
  metadata: percolationMetadata,
  params: percolationParams,
  simulation: percolationSimulation,
  // One site opens per step, so a full sweep takes `duration` seconds at any grid size.
  stepsPerSecond: (params) => (params.side * params.side) / params.duration,
  execution: "worker",
  renderer: {
    engine: "pixi",
    load: () => import("./renderer").then((m) => m.createPercolationRenderer),
  },
  explanation: () => import("./explanation.mdx"),
});
