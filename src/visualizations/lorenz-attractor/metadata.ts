import type { VisualizationMetadata } from "@/lib/visualization/types";

export const lorenzMetadata: VisualizationMetadata = {
  slug: "lorenz-attractor",
  title: "Lorenz Attractor",
  description:
    "Hundreds of trajectories start almost at the same point, then spread across the butterfly-shaped Lorenz attractor. Drag to rotate.",
  category: "Dynamical systems",
  difficulty: "intermediate",
  tags: ["chaos", "strange attractor", "differential equations", "3D"],
  relatedConcepts: [
    "Sensitive dependence on initial conditions",
    "Lyapunov exponent",
    "Runge–Kutta methods",
  ],
  references: [
    {
      title: "Deterministic Nonperiodic Flow",
      authors: "Edward N. Lorenz",
      year: 1963,
      url: "https://doi.org/10.1175/1520-0469(1963)020%3C0130:DNF%3E2.0.CO;2",
      note: "Journal of the Atmospheric Sciences 20(2), 130–141. Introduces the system, with σ = 10, β = 8/3 and ρ = 28.",
    },
    {
      title: "A Rigorous ODE Solver and Smale's 14th Problem",
      authors: "Warwick Tucker",
      year: 2002,
      url: "https://doi.org/10.1007/s002080010018",
      note: "Foundations of Computational Mathematics 2(1), 53–117. A computer-assisted proof that the Lorenz attractor exists and is a strange attractor.",
    },
  ],
};
