import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const pottsParams = latticeParams({
  q: {
    label: "States",
    description:
      "Number of values a site can take. The transition is continuous up to 4 states and abrupt above.",
    min: 2,
    max: 10,
    step: 1,
    default: 3,
  },
  // Not `temperature`: Ising's key means an absolute temperature, and the
  // model switcher carries shared keys over (ADR 0014).
  relativeTemperature: {
    label: "Temperature",
    description: "As a multiple of the critical temperature, so 1 is the phase transition.",
    min: 0.5,
    max: 2,
    step: 0.01,
    default: 1,
    unit: "× Tc",
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting state",
    description: "Random states (infinitely hot) or every site in the same state (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All the same (cold start)" },
    ],
    default: "random",
  },
});

export type PottsParams = ParamValues<typeof pottsParams>;
