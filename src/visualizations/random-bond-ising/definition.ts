import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeRandomBondIsing } from "@/visualizations/random-bond-ising/describe";
import { randomBondIsingMetadata } from "@/visualizations/random-bond-ising/metadata";
import { randomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";

export const randomBondIsing = defineLatticeVisualization({
  metadata: randomBondIsingMetadata,
  params: randomBondIsingParams,
  simulation: randomBondIsingSimulation,
  renderer: () => import("./renderer").then((m) => m.createRandomBondIsingRenderer),
  describe: describeRandomBondIsing,
  explanation: () => import("./explanation.mdx"),
});
