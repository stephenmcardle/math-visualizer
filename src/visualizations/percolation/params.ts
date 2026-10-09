import type { ParamSchema, ParamValues } from "@/lib/url-state/params";

export const percolationParams = {
  side: {
    label: "Grid size",
    description: "Sites along each side of the square lattice.",
    min: 16,
    max: 512,
    step: 8,
    default: 128,
    unit: "sites",
  },
  duration: {
    label: "Sweep time",
    description: "Seconds to open every site, from p = 0 to p = 1.",
    min: 5,
    max: 120,
    step: 1,
    default: 30,
    unit: "s",
    live: true,
  },
} satisfies ParamSchema;

export type PercolationParams = ParamValues<typeof percolationParams>;
