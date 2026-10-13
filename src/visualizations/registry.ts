import { createRegistry } from "@/lib/visualization/registry";
import { ashkinTeller } from "@/visualizations/ashkin-teller/definition";
import { isingModel } from "@/visualizations/ising-model/definition";
import { lorenzAttractor } from "@/visualizations/lorenz-attractor/definition";
import { o3Model } from "@/visualizations/o3-model/definition";
import { percolation } from "@/visualizations/percolation/definition";
import { pottsModel } from "@/visualizations/potts-model/definition";
import { randomBondIsing } from "@/visualizations/random-bond-ising/definition";
import { randomWalk } from "@/visualizations/random-walk/definition";
import { xyModel } from "@/visualizations/xy-model/definition";

/**
 * Every visualization in the app. Add new definitions here; order is the
 * order shown on the home page.
 */
export const visualizations = createRegistry([
  randomWalk,
  percolation,
  lorenzAttractor,
  isingModel,
  pottsModel,
  randomBondIsing,
  ashkinTeller,
  xyModel,
  o3Model,
]);
