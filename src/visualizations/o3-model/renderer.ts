import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { o3Painter } from "@/visualizations/o3-model/painter";

export const createO3Renderer = createLatticeRenderer(o3Painter);
