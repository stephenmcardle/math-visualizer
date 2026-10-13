import type { VisualizationMetadata } from "@/lib/visualization/types";

export const o3Metadata: VisualizationMetadata = {
  slug: "o3-model",
  title: "O(3) Model",
  description:
    "Arrows that can point in any direction in space. Unlike the XY model there is no transition at all: regions of agreement grow enormously as it cools, but never become infinite.",
  category: "Statistical mechanics",
  difficulty: "advanced",
  family: "Lattice spin models",
  tags: ["o(3) model", "heisenberg model", "markov chain monte carlo"],
  relatedConcepts: ["Mermin–Wagner theorem", "Correlation length", "Asymptotic freedom"],
  references: [
    {
      title:
        "Absence of Ferromagnetism or Antiferromagnetism in One- or Two-Dimensional Isotropic Heisenberg Models",
      authors: "N. D. Mermin and H. Wagner",
      year: 1966,
      url: "https://doi.org/10.1103/PhysRevLett.17.1133",
      note: "Physical Review Letters 17, 1133–1136. No alignment at any positive temperature in two dimensions.",
    },
    {
      title:
        "Interaction of goldstone particles in two dimensions. Applications to ferromagnets and massive Yang-Mills fields",
      authors: "A. M. Polyakov",
      year: 1975,
      url: "https://doi.org/10.1016/0370-2693(75)90161-6",
      note: "Physics Letters B 59, 79–81. Predicts a finite correlation length at every positive temperature, growing exponentially in 1/T.",
    },
    {
      title: "Exponential decay in two-dimensional classical O(n) models",
      authors: "OpenAI",
      year: 2026,
      url: "https://github.com/openai/math/blob/main/preprints/Exponential-decay-in-two-dimensional-classical-On-models-September-23-2026/paper.pdf",
      note: "Unrefereed manuscript in the openai/math collection (family 215). Its main result is formalized in Lean, according to the collection's formalization catalog. It proves that correlations decay exponentially at every positive temperature, for n ≥ 3: the claim this page illustrates.",
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
