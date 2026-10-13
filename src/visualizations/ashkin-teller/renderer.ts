import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { ashkinTellerPainter } from "@/visualizations/ashkin-teller/painter";

export const createAshkinTellerRenderer = createLatticeRenderer(ashkinTellerPainter);
