import type { VisualizationMetadata } from "@/lib/visualization/types";

export const percolationMetadata: VisualizationMetadata = {
  slug: "percolation",
  title: "Site Percolation",
  description:
    "Open the sites of a grid one at a time, at random, and watch clusters merge until one suddenly connects top to bottom near p ≈ 0.593.",
  category: "Probability",
  difficulty: "intermediate",
  tags: ["percolation", "phase transition", "random graph", "union-find"],
  relatedConcepts: ["Critical phenomena", "Giant component", "Union-find"],
  references: [
    {
      title: "Percolation processes",
      authors: "S. R. Broadbent and J. M. Hammersley",
      year: 1957,
      url: "https://doi.org/10.1017/S0305004100032680",
      note: "Mathematical Proceedings of the Cambridge Philosophical Society 53(3), 629–641. The paper that introduced percolation theory.",
    },
    {
      title: "Efficient Monte Carlo Algorithm and High-Precision Results for Percolation",
      authors: "M. E. J. Newman and R. M. Ziff",
      year: 2000,
      url: "https://doi.org/10.1103/PhysRevLett.85.4104",
      note: "Physical Review Letters 85, 4104. The sweep algorithm used here, and the estimate p_c = 0.59274621(13) for square-lattice site percolation.",
    },
  ],
};
