import type { VisualizationMetadata } from "@/lib/visualization/types";

export const isingMetadata: VisualizationMetadata = {
  slug: "ising-model",
  title: "Ising Model",
  description:
    "Tiny magnets on a grid try to align with their neighbors while heat flips them at random. Cool the grid below the critical temperature, about 2.269, and it magnetizes.",
  category: "Statistical mechanics",
  difficulty: "intermediate",
  family: "Lattice spin models",
  tags: ["ising model", "phase transition", "markov chain monte carlo", "metropolis algorithm"],
  relatedConcepts: ["Critical phenomena", "Boltzmann distribution", "Markov chain Monte Carlo"],
  references: [
    {
      title: "Beitrag zur Theorie des Ferromagnetismus",
      authors: "E. Ising",
      year: 1925,
      url: "https://doi.org/10.1007/BF02980577",
      note: "Zeitschrift für Physik 31, 253–258. Solves the one-dimensional model, which has no phase transition.",
    },
    {
      title: "Crystal Statistics. I. A Two-Dimensional Model with an Order-Disorder Transition",
      authors: "L. Onsager",
      year: 1944,
      url: "https://doi.org/10.1103/PhysRev.65.117",
      note: "Physical Review 65, 117–149. The exact solution on the square lattice, with its transition at T_c = 2/ln(1 + √2).",
    },
    {
      title: "The Spontaneous Magnetization of a Two-Dimensional Ising Model",
      authors: "C. N. Yang",
      year: 1952,
      url: "https://doi.org/10.1103/PhysRev.85.808",
      note: "Physical Review 85, 808–816. The magnetization below T_c.",
    },
    {
      title: "Equation of State Calculations by Fast Computing Machines",
      authors: "N. Metropolis, A. W. Rosenbluth, M. N. Rosenbluth, A. H. Teller and E. Teller",
      year: 1953,
      url: "https://doi.org/10.1063/1.1699114",
      note: "The Journal of Chemical Physics 21, 1087–1092. The sampling algorithm used here.",
    },
  ],
};
