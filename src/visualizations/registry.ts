import { createRegistry } from "@/lib/visualization/registry";
import { randomWalk } from "@/visualizations/random-walk/definition";

/**
 * Every visualization in the app. Add new definitions here; order is the
 * order shown on the home page.
 */
export const visualizations = createRegistry([randomWalk]);
