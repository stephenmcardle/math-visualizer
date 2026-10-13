import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const ashkinTellerParams = latticeParams({
  coupling: {
    label: "Four-spin coupling",
    description:
      "K: how strongly the two Ising layers interact. 0 is two independent Ising models; 1 is the 4-state Potts model.",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.5,
  },
  // Same key and range as the Potts model's: the model switcher carries shared keys over.
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
    label: "Starting spins",
    description: "Random spins (infinitely hot) or every spin up in both layers (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
});

export type AshkinTellerParams = ParamValues<typeof ashkinTellerParams>;
