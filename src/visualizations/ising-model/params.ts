import { paletteParam } from "@/lib/rendering/palettes";
import type { ParamSchema, ParamValues } from "@/lib/url-state/params";

export const isingParams = {
  side: {
    label: "Grid size",
    description: "Spins along each side of the square lattice, which wraps around at the edges.",
    min: 32,
    max: 512,
    step: 32,
    default: 128,
    unit: "spins",
  },
  temperature: {
    label: "Temperature",
    description:
      "In units of the coupling between neighbors. The phase transition is at about 2.269.",
    min: 0.5,
    max: 5,
    step: 0.01,
    default: 2.27,
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random spins (infinitely hot) or every spin up (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
  speed: {
    label: "Speed",
    description: "Sweeps per second. One sweep is one attempted flip per spin, on average.",
    min: 1,
    max: 100,
    step: 1,
    default: 30,
    unit: "sweeps/s",
    live: true,
  },
  palette: paletteParam,
} satisfies ParamSchema;

export type IsingParams = ParamValues<typeof isingParams>;
