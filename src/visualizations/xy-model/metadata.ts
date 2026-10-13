import type { VisualizationMetadata } from "@/lib/visualization/types";

export const xyMetadata: VisualizationMetadata = {
  slug: "xy-model",
  title: "XY Model",
  description:
    "Arrows that can point in any direction in the plane. They never fully align, but below about 0.893 the swirling vortices pair up and the arrows stay correlated over long distances.",
  category: "Statistical mechanics",
  difficulty: "advanced",
  family: "Lattice spin models",
  tags: ["xy model", "phase transition", "vortices", "markov chain monte carlo"],
  relatedConcepts: [
    "Berezinskii–Kosterlitz–Thouless transition",
    "Topological defects",
    "Mermin–Wagner theorem",
  ],
  references: [
    {
      title: "Ordering, metastability and phase transitions in two-dimensional systems",
      authors: "J. M. Kosterlitz and D. J. Thouless",
      year: 1973,
      url: "https://doi.org/10.1088/0022-3719/6/7/010",
      note: "Journal of Physics C 6, 1181–1203. The vortex-unbinding transition.",
    },
    {
      title:
        "Absence of Ferromagnetism or Antiferromagnetism in One- or Two-Dimensional Isotropic Heisenberg Models",
      authors: "N. D. Mermin and H. Wagner",
      year: 1966,
      url: "https://doi.org/10.1103/PhysRevLett.17.1133",
      note: "Physical Review Letters 17, 1133–1136. Why the arrows never fully align in two dimensions.",
    },
    {
      title:
        "The Kosterlitz-Thouless transition in two-dimensional Abelian spin systems and the Coulomb gas",
      authors: "J. Fröhlich and T. Spencer",
      year: 1981,
      url: "https://doi.org/10.1007/BF01208273",
      note: "Communications in Mathematical Physics 81, 527–602. Proves the transition exists.",
    },
    {
      title:
        "The two-dimensional XY model at the transition temperature: a high-precision Monte Carlo study",
      authors: "M. Hasenbusch",
      year: 2005,
      url: "https://doi.org/10.1088/0305-4470/38/26/003",
      note: "Journal of Physics A 38, 5869–5883. The transition temperature, about 0.893.",
    },
    {
      title: "Essential Singularity of the Correlation Length in the Planar XY Model",
      authors: "OpenAI",
      year: 2026,
      url: "https://github.com/openai/math/blob/main/preprints/Essential-Singularity-of-the-Correlation-Length-in-the-Planar-XY-Model-October-5-2026/paper.pdf",
      note: "Unrefereed manuscript in the openai/math collection (family 216); its main result is not Lean-formalized. It proves the predicted way the correlation length blows up as the temperature falls to the transition.",
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
