import type { VisualizationMetadata } from "@/lib/visualization/types";

export const randomWalkMetadata: VisualizationMetadata = {
  slug: "random-walk",
  title: "2D Random Walk",
  description:
    "Independent walkers take fixed-length steps in uniformly random directions. Watch the cloud spread like the square root of time.",
  category: "Probability",
  difficulty: "introductory",
  tags: ["stochastic process", "random walk", "diffusion"],
  relatedConcepts: ["Brownian motion", "Central limit theorem", "Diffusion equation"],
  references: [
    {
      title: "The Problem of the Random Walk",
      authors: "Karl Pearson",
      year: 1905,
      url: "https://doi.org/10.1038/072294b0",
      note: "Nature 72, 294. Pearson's letter posing the problem.",
    },
    {
      title: "The Problem of the Random Walk",
      authors: "Lord Rayleigh",
      year: 1905,
      url: "https://doi.org/10.1038/072318a0",
      note: "Nature 72, 318. Rayleigh's reply to Pearson's letter.",
    },
  ],
};
