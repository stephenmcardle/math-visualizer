import { defineVisualization } from "@/lib/visualization/types";
import { describeIsing } from "@/visualizations/ising-model/describe";
import { isingMetadata } from "@/visualizations/ising-model/metadata";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";

export const isingModel = defineVisualization({
  metadata: isingMetadata,
  params: isingParams,
  simulation: isingSimulation,
  // One step is one sweep of the whole lattice: up to 512² spin updates.
  stepsPerSecond: (params) => params.speed,
  execution: "worker",
  renderer: {
    engine: "pixi",
    load: () => import("./renderer").then((m) => m.createIsingRenderer),
  },
  describe: describeIsing,
  explanation: () => import("./explanation.mdx"),
});
