import type { VisualizationMetadata } from "@/lib/visualization/types";

export const randomBondIsingMetadata: VisualizationMetadata = {
  slug: "random-bond-ising",
  title: "Random-Bond Ising Model",
  description:
    "The Ising model with bonds of random strength, fixed for the whole run. At its critical temperature, weak disorder leaves the picture looking like the ordinary Ising model's.",
  category: "Statistical mechanics",
  difficulty: "advanced",
  family: "Lattice spin models",
  tags: ["ising model", "phase transition", "disorder", "markov chain monte carlo"],
  relatedConcepts: ["Quenched disorder", "Duality", "Schramm–Loewner evolution"],
  references: [
    {
      title:
        "Critical temperature for two-dimensional Ising ferromagnets with quenched bond disorder",
      authors: "R. Fisch",
      year: 1978,
      url: "https://doi.org/10.1007/BF01014302",
      note: "Journal of Statistical Physics 18, 111–114. The duality argument for the critical temperature used here.",
    },
    {
      title: "Critical properties of random Potts models",
      authors: "W. Kinzel and E. Domany",
      year: 1981,
      url: "https://doi.org/10.1103/PhysRevB.23.3421",
      note: "Physical Review B 23, 3421–3434.",
    },
    {
      title: "Universality in the 2D Ising model and conformal invariance of fermionic observables",
      authors: "D. Chelkak and S. Smirnov",
      year: 2012,
      url: "https://doi.org/10.1007/s00222-011-0371-2",
      note: "Inventiones mathematicae 189, 515–580. Critical interfaces of the ordinary Ising model converge to SLE₃.",
    },
    {
      title: "Quenched SLE₃ Universality for the Weak Random-Bond Ising Model",
      authors: "OpenAI",
      year: 2026,
      url: "https://github.com/openai/math/blob/main/preprints/Quenched-SLE3-Universality-for-the-Weak-Random-Bond-Ising-Model-October-5-2026/quenched-sle3-weak-random-bond-ising.pdf",
      note: "Unrefereed manuscript in the openai/math collection (family 218); its main result is not Lean-formalized. It proves that with weak enough disorder of this two-valued kind, critical interfaces still converge to SLE₃, for almost every choice of bonds. Those interfaces need boundary conditions this page doesn't have; it shows the spins on a torus.",
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
