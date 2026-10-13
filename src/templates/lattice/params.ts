import { paletteParam } from "@/lib/rendering/palettes";
import type { ParamSchema } from "@/lib/url-state/params";

/**
 * A lattice model's full param schema: grid size, then the model's own params,
 * then speed and palette. Every lattice model shares these three keys, so the
 * model switcher carries them over (ADR 0014).
 */
export function latticeParams<const P extends ParamSchema>(model: P) {
  return {
    side: {
      label: "Grid size",
      description: "Sites along each side of the square lattice, which wraps around at the edges.",
      min: 32,
      max: 512,
      step: 32,
      default: 128,
      unit: "sites",
    },
    ...model,
    speed: {
      label: "Speed",
      description: "Sweeps per second. One sweep is one update attempt per site, on average.",
      min: 1,
      max: 100,
      step: 1,
      default: 30,
      unit: "sweeps/s",
      live: true,
    },
    palette: paletteParam,
  } satisfies ParamSchema;
}
