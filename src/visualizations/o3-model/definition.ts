import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeO3 } from "@/visualizations/o3-model/describe";
import { o3Metadata } from "@/visualizations/o3-model/metadata";
import { o3Params } from "@/visualizations/o3-model/params";
import { o3Simulation } from "@/visualizations/o3-model/simulation";

export const o3Model = defineLatticeVisualization({
  metadata: o3Metadata,
  params: o3Params,
  simulation: o3Simulation,
  renderer: () => import("./renderer").then((m) => m.createO3Renderer),
  describe: describeO3,
  explanation: () => import("./explanation.mdx"),
});
