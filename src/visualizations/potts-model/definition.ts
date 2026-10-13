import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describePotts } from "@/visualizations/potts-model/describe";
import { pottsMetadata } from "@/visualizations/potts-model/metadata";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";

export const pottsModel = defineLatticeVisualization({
  metadata: pottsMetadata,
  params: pottsParams,
  simulation: pottsSimulation,
  renderer: () => import("./renderer").then((m) => m.createPottsRenderer),
  describe: describePotts,
  explanation: () => import("./explanation.mdx"),
});
