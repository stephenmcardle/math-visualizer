import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeXy } from "@/visualizations/xy-model/describe";
import { xyMetadata } from "@/visualizations/xy-model/metadata";
import { xyParams } from "@/visualizations/xy-model/params";
import { xySimulation } from "@/visualizations/xy-model/simulation";

export const xyModel = defineLatticeVisualization({
  metadata: xyMetadata,
  params: xyParams,
  simulation: xySimulation,
  renderer: () => import("./renderer").then((m) => m.createXyRenderer),
  describe: describeXy,
  explanation: () => import("./explanation.mdx"),
});
