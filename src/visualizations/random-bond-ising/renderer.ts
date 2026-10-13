import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { randomBondIsingPainter } from "@/visualizations/random-bond-ising/painter";

export const createRandomBondIsingRenderer = createLatticeRenderer(randomBondIsingPainter);
