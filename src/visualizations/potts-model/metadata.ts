import type { VisualizationMetadata } from "@/lib/visualization/types";

export const pottsMetadata: VisualizationMetadata = {
  slug: "potts-model",
  title: "Potts Model",
  description:
    "Each site on a grid takes one of q colors and prefers to match its neighbors. With up to 4 colors the order melts gradually at the critical temperature; with more it breaks abruptly.",
  category: "Statistical mechanics",
  difficulty: "intermediate",
  family: "Lattice spin models",
  tags: ["potts model", "phase transition", "markov chain monte carlo", "metropolis algorithm"],
  relatedConcepts: ["Ising model", "Random-cluster model", "First-order phase transition"],
  references: [
    {
      title: "Some generalized order-disorder transformations",
      authors: "R. B. Potts",
      year: 1952,
      url: "https://doi.org/10.1017/S0305004100027419",
      note: "Mathematical Proceedings of the Cambridge Philosophical Society 48, 106–109. Introduces the model.",
    },
    {
      title: "The Potts model",
      authors: "F. Y. Wu",
      year: 1982,
      url: "https://doi.org/10.1103/RevModPhys.54.235",
      note: "Reviews of Modern Physics 54, 235–268. A survey of the model and its exact results.",
    },
    {
      title:
        "The self-dual point of the two-dimensional random-cluster model is critical for q ≥ 1",
      authors: "V. Beffara and H. Duminil-Copin",
      year: 2012,
      url: "https://doi.org/10.1007/s00440-011-0353-8",
      note: "Probability Theory and Related Fields 153, 511–542. Proves the critical temperature T_c = 1/ln(1 + √q).",
    },
    {
      title:
        "Continuity of the phase transition for planar random-cluster and Potts models with 1 ≤ q ≤ 4",
      authors: "H. Duminil-Copin, V. Sidoravicius and V. Tassion",
      year: 2017,
      url: "https://doi.org/10.1007/s00220-016-2759-8",
      note: "Communications in Mathematical Physics 349, 47–107.",
    },
    {
      title:
        "Discontinuity of the phase transition for the planar random-cluster and Potts models with q > 4",
      authors: "H. Duminil-Copin, M. Gagnebin, M. Harel, I. Manolescu and V. Tassion",
      year: 2016,
      url: "https://arxiv.org/abs/1611.09877",
      note: "arXiv preprint.",
    },
    {
      title: "Square-lattice FK interfaces and nested loops for 1 ≤ q < 4",
      authors: "OpenAI",
      year: 2026,
      url: "https://github.com/openai/math/blob/main/preprints/Square-lattice-FK-interfaces-and-nested-loops-for-1-leq-q-lt-4-September-23-2026/paper.pdf",
      note: "Unrefereed manuscript in the openai/math collection (family 223); its main result is not Lean-formalized. It proves that cluster boundaries in this model's random-cluster picture converge to SLE curves at T_c. This page shows the spins, not those boundaries.",
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
