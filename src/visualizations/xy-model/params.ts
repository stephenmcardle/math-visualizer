import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const xyParams = latticeParams({
  // Same key and range as the Ising model's absolute temperature (ADR 0014).
  temperature: {
    label: "Temperature",
    description:
      "In units of the coupling between neighbors. The vortex-unbinding transition is at about 0.893.",
    min: 0.5,
    max: 5,
    step: 0.01,
    default: 0.89,
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random directions (infinitely hot) or all pointing the same way (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All aligned (cold start)" },
    ],
    default: "random",
  },
});

export type XyParams = ParamValues<typeof xyParams>;
