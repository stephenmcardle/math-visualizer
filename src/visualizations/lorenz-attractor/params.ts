import type { ParamSchema, ParamValues } from "@/lib/url-state/params";

export const lorenzParams = {
  trajectories: {
    label: "Trajectories",
    description: "Number of trajectories, all starting inside one tiny cube.",
    min: 1,
    max: 1000,
    step: 1,
    default: 200,
  },
  spread: {
    label: "Initial spread",
    description: "Side length of the cube the starting points are drawn from.",
    min: 0.001,
    max: 1,
    step: 0.001,
    default: 0.01,
  },
  rho: {
    label: "ρ (rho)",
    description: "Scaled Rayleigh number. Lorenz used 28; small values let the motion settle down.",
    min: 0,
    max: 60,
    step: 0.1,
    default: 28,
  },
  speed: {
    label: "Speed",
    description: "Integration steps per second (each step advances time by 0.005).",
    min: 20,
    max: 600,
    step: 10,
    default: 300,
    unit: "steps/s",
    live: true,
  },
} satisfies ParamSchema;

export type LorenzParams = ParamValues<typeof lorenzParams>;
