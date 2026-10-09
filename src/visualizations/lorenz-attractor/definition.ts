import { defineVisualization } from "@/lib/visualization/types";
import { lorenzMetadata } from "@/visualizations/lorenz-attractor/metadata";
import { lorenzParams } from "@/visualizations/lorenz-attractor/params";
import { lorenzSimulation } from "@/visualizations/lorenz-attractor/simulation";

export const lorenzAttractor = defineVisualization({
  metadata: lorenzMetadata,
  params: lorenzParams,
  simulation: lorenzSimulation,
  stepsPerSecond: (params) => params.speed,
  execution: "main",
  renderer: {
    engine: "three",
    load: () => import("./renderer").then((m) => m.createLorenzRenderer),
  },
  explanation: () => import("./explanation.mdx"),
});
