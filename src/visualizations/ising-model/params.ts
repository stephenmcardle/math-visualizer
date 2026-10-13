import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const isingParams = latticeParams({
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
});

export type IsingParams = ParamValues<typeof isingParams>;
