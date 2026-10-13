import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { pottsPainter } from "@/visualizations/potts-model/painter";

export const createPottsRenderer = createLatticeRenderer(pottsPainter);
