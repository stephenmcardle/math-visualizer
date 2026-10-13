import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const randomBondIsingParams = latticeParams({
  disorder: {
    label: "Disorder",
    description:
      "ε: each bond's strength is 1 + ε or 1 − ε, at random. 0 is the ordinary Ising model.",
    min: 0,
    max: 0.9,
    step: 0.05,
    default: 0.3,
  },
  // A multiple of this model's critical temperature, with the same key and range as the
  // Potts model's, since the model switcher carries shared keys over (ADR 0014).
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
    description: "Random spins (infinitely hot) or every spin up (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
});

export type RandomBondIsingParams = ParamValues<typeof randomBondIsingParams>;
