import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeAshkinTeller } from "@/visualizations/ashkin-teller/describe";
import { ashkinTellerMetadata } from "@/visualizations/ashkin-teller/metadata";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";

export const ashkinTeller = defineLatticeVisualization({
  metadata: ashkinTellerMetadata,
  params: ashkinTellerParams,
  simulation: ashkinTellerSimulation,
  renderer: () => import("./renderer").then((m) => m.createAshkinTellerRenderer),
  describe: describeAshkinTeller,
  explanation: () => import("./explanation.mdx"),
});
