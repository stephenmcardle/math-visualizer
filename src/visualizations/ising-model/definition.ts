import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeIsing } from "@/visualizations/ising-model/describe";
import { isingMetadata } from "@/visualizations/ising-model/metadata";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";

export const isingModel = defineLatticeVisualization({
  metadata: isingMetadata,
  params: isingParams,
  simulation: isingSimulation,
  renderer: () => import("./renderer").then((m) => m.createIsingRenderer),
  describe: describeIsing,
  explanation: () => import("./explanation.mdx"),
});
