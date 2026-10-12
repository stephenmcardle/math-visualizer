import type { ParamSchema, ParamValues } from "@/lib/url-state/params";

export const randomWalkParams = {
  walkers: {
    label: "Walkers",
    description: "Number of independent walkers, all starting at the origin.",
    min: 1,
    max: 2000,
    step: 1,
    default: 100,
  },
  stepSize: {
    label: "Step size",
    description: "Length of every step.",
    min: 0.5,
    max: 20,
    step: 0.5,
    default: 3,
    unit: "px",
    live: true,
  },
  speed: {
    label: "Speed",
    description: "Steps per second.",
    min: 1,
    max: 240,
    step: 1,
    default: 30,
    unit: "steps/s",
    live: true,
  },
  directions: {
    type: "enum",
    label: "Step directions",
    description: "Any direction (an isotropic walk), or only up, down, left and right.",
    options: [
      { value: "any", label: "Any direction" },
      { value: "grid", label: "Grid (4 directions)" },
    ],
    default: "any",
  },
  trails: {
    type: "boolean",
    label: "Show trails",
    description: "Draw each walker's path. Turn off to see only current positions.",
    default: true,
    live: true,
  },
} satisfies ParamSchema;

export type RandomWalkParams = ParamValues<typeof randomWalkParams>;
