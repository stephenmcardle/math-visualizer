import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const o3Params = latticeParams({
  // Same key and range as the Ising model's absolute temperature (ADR 0014).
  temperature: {
    label: "Temperature",
    description:
      "In units of the coupling between neighbors. There is no phase transition: the spins never order above zero temperature.",
    min: 0.5,
    max: 5,
    step: 0.01,
    default: 1,
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random directions (infinitely hot) or all pointing up (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
});

export type O3Params = ParamValues<typeof o3Params>;
