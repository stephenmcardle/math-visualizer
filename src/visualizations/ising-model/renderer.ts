import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { isingPainter } from "@/visualizations/ising-model/painter";

export const createIsingRenderer = createLatticeRenderer(isingPainter);
