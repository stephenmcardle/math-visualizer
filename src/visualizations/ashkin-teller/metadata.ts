import type { VisualizationMetadata } from "@/lib/visualization/types";

export const ashkinTellerMetadata: VisualizationMetadata = {
  slug: "ashkin-teller",
  title: "Ashkin–Teller Model",
  description:
    "Two Ising models on one grid, coupled by a four-spin interaction. Turning the coupling up moves the critical point continuously from two independent Ising models to the 4-state Potts model.",
  category: "Statistical mechanics",
  difficulty: "advanced",
  family: "Lattice spin models",
  tags: ["ashkin-teller model", "phase transition", "markov chain monte carlo"],
  relatedConcepts: ["Ising model", "Potts model", "Line of critical points"],
  references: [
    {
      title: "Statistics of Two-Dimensional Lattices with Four Components",
      authors: "J. Ashkin and E. Teller",
      year: 1943,
      url: "https://doi.org/10.1103/PhysRev.64.178",
      note: "Physical Review 64, 178–184. Introduces the model.",
    },
    {
      title: "Phase diagram of the Ashkin-Teller model",
      authors: "Y. Aoun, M. Dober and A. Glazman",
      year: 2023,
      url: "https://arxiv.org/abs/2301.10609",
      note: "arXiv preprint. Proves that for four-spin coupling at most the Ising coupling, both transitions happen on the self-dual curve sinh(2J) = e^(−2U) used here.",
    },
    {
      title: "The joint scaling limit of critical Ashkin–Teller currents",
      authors: "OpenAI",
      year: 2026,
      url: "https://github.com/openai/math/blob/main/preprints/The-joint-scaling-limit-of-critical-Ashkin-Teller-currents-October-6-2026/main.pdf",
      note: "Unrefereed manuscript in the openai/math collection (family 233); its main result is not Lean-formalized. It identifies the scaling limit of the model's height function and current clusters along the whole critical line. This page shows the spins, not those objects.",
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
