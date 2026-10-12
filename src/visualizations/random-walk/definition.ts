import { defineVisualization } from "@/lib/visualization/types";
import { describeRandomWalk } from "@/visualizations/random-walk/describe";
import { randomWalkMetadata } from "@/visualizations/random-walk/metadata";
import { randomWalkParams } from "@/visualizations/random-walk/params";
import { randomWalkSimulation } from "@/visualizations/random-walk/simulation";

export const randomWalk = defineVisualization({
  metadata: randomWalkMetadata,
  params: randomWalkParams,
  simulation: randomWalkSimulation,
  stepsPerSecond: (params) => params.speed,
  execution: "main",
  renderer: {
    engine: "pixi",
    load: () => import("./renderer").then((m) => m.createRandomWalkRenderer),
  },
  describe: describeRandomWalk,
  explanation: () => import("./explanation.mdx"),
});
