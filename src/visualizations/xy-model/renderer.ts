import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { xyPainter } from "@/visualizations/xy-model/painter";

export const createXyRenderer = createLatticeRenderer(xyPainter);
