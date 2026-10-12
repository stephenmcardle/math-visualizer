# openai/math: which results we can visualize

**Reviewed:** 2026-10-12, against [openai/math](https://github.com/openai/math) at its October 6, 2026
overview (372 result families, 719 manuscripts; Apache-2.0).

**What was read:** the overview's description of all 372 families; the manuscript abstracts in
`CONTENTS.md` for the shortlisted families; and `lean/formalization.yaml`, to see which of them
have a Lean-checked main result. The October 7 withdrawals (three algebraic-geometry papers) don't
touch any candidate here.

## How to read this

The collection isn't a list of equations. Each family is a theorem, usually asymptotic or
structural, about some mathematical object. A visualization can't show a proof. What it can do is
simulate the object the theorem is about and let a viewer see the behavior it predicts: a limit
shape, an exponent, a threshold, a count of limit cycles. So the drop-in unit for a template is a
**model**: its state, an update rule, how a state is colored, and the observable the theorem talks
about.

Categories:

- **Do now:** the model fits a template we already have (lattice Markov chain, lattice cluster
  growth, planar particles, 3D ODE flow). It needs a new simulation and at most small renderer
  changes.
- **Do later:** a faithful picture exists, but it needs a template we don't have yet (billiards,
  density images, graph processes, statistic plots, PDE grids, hex-lattice paths, and others).
- **Maybe:** visualizable in principle, but one of three things holds:
  - the link to the theorem would be loose;
  - the construction in the paper may not be explicit enough to draw;
  - the payoff looks low for the effort.
- **Not possible:** no honest picture of the result in a browser. This covers abstract algebra,
  topology, operator algebras, logic, most complexity theory, high-dimensional or
  infinite-dimensional statements, and quantum many-body ground states.

**Trust:** these are unrefereed manuscripts produced by a model. About 42% of top-line results are
Lean-formalized, and the collection has already withdrawn and revised papers. In the "Do now"
table, **Lean: yes** means the specific manuscript a visualization would illustrate is in
`lean/formalization.yaml`. For all six "yes" rows that is the case: O(n) exponential decay, the
exponential FPP limit shape, the Gaussian moat, ballisticity, Steinitz–Bergström and the quintic
Liénard bound.

## Summary

| Subject                               | Families | Do now | Do later | Maybe  | Not possible |
| ------------------------------------- | -------- | ------ | -------- | ------ | ------------ |
| Theoretical computer science          | 40       |        |          | 3      | 37           |
| Combinatorics                         | 37       |        | 1        | 10     | 26           |
| Algebraic and complex geometry        | 36       |        |          |        | 36           |
| Number theory                         | 31       | 1      | 5        | 3      | 22           |
| Probability and statistical mechanics | 29       | 7      | 11       | 6      | 5            |
| Differential geometry                 | 29       |        | 2        | 3      | 24           |
| Mathematical physics                  | 25       |        | 1        | 1      | 23           |
| Operator algebras                     | 19       |        |          |        | 19           |
| Algebra                               | 18       |        |          |        | 18           |
| Topology                              | 18       |        |          |        | 18           |
| Real and complex analysis             | 16       |        |          | 3      | 13           |
| Partial differential equations        | 16       |        | 3        | 3      | 10           |
| Convex and metric geometry            | 15       | 1      | 1        | 3      | 10           |
| Group theory                          | 14       |        |          |        | 14           |
| Dynamical systems and ergodic theory  | 12       | 2      | 4        | 1      | 5            |
| Functional analysis                   | 11       |        |          |        | 11           |
| Mathematical logic                    | 6        |        |          |        | 6            |
| **Total**                             | **372**  | **11** | **28**   | **36** | **297**      |

Nearly all of the usable material is in probability and statistical mechanics, dynamics and a few
pockets of number theory and geometry. That is also where our four existing visualizations sit.

## Templates this implies

The existing visualizations generalize into four templates. The candidates add several more.

| Template                      | Today       | Do now                  | Do later                          |
| ----------------------------- | ----------- | ----------------------- | --------------------------------- |
| **T1 Lattice Markov chain**   | Ising       | 218, 223, 233, 216, 215 | 225, 232, 226 (with new samplers) |
| **T2 Lattice cluster/growth** | Percolation | 212, 028                | 231, 224, 213 (3D)                |
| **T3 Planar particles**       | Random walk | 220, 097, 143, 146      | (billiards may fold in; see T6)   |
| **T4 3D ODE flow**            | Lorenz      |                         | (149 is a maybe)                  |
| T5 Density image              |             |                         | 153, 148                          |
| T6 Billiards                  |             |                         | 147, 150                          |
| T7 Interacting particles      |             |                         | 090, 364                          |
| T8 Graph processes            |             |                         | 188, 219                          |
| T9 Statistic vs prediction    |             |                         | 235, 238, 012, 026, 011, 017      |
| T10 Grid fields (PDE, eigen)  |             |                         | 375, 369, 261, 350                |
| T11 Hex-lattice paths         |             |                         | 237, 230                          |
| T12 Complex plane             |             |                         | 003                               |
| T13 3D parametric shapes      |             |                         | 354                               |

T1 and T3 have the most drop-ins, so they should come first in the template plan. T2 is close
behind. T4 has only Lorenz plus one weak candidate, so it isn't worth templatizing yet.

## Do now (11)

| #   | Family (short)                    | Model to simulate                                                                                    | Template | What a viewer sees                                                                                                                | Lean |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 218 | Random-bond Ising                 | Ising with bonds $J_e = 1 + \varepsilon\xi_e$, $\xi_e = \pm1$ fair, at the critical temperature      | T1       | Weak disorder leaves critical interfaces looking like the clean model's (both converge to SLE₃)                                   | no   |
| 223 | Random-cluster / Potts            | $q$-state Potts at $\beta_c = \ln(1+\sqrt q)$, $q$ as a param                                        | T1       | Continuous transition for $q \le 4$ (fractal domains), coexistence for $q > 4$. The theorem's object is the FK interface (later). | no   |
| 233 | Ashkin–Teller                     | Two coupled Ising layers $\sigma, \tau$ with four-spin coupling, on the critical line                | T1       | Four colors for the $(\sigma,\tau)$ pairs; one critical line from Ising-like to the four-state Potts point                        | no   |
| 216 | Planar XY (BKT)                   | Angle spins, Metropolis, $T$ around $T_{\mathrm{BKT}} \approx 0.89$                                  | T1       | Vortex–antivortex pairs bind below $T_{\mathrm{BKT}}$ and unbind above it; quasi-long-range order                                 | no   |
| 215 | Planar O(3)                       | 3-vector spins, Metropolis                                                                           | T1       | No order at any positive temperature (exponential correlation decay), unlike XY                                                   | yes  |
| 212 | First-passage percolation         | Exponential edge weights from the origin (an Eden-type growth); arrival time per site; geodesic tree | T2       | A limit shape close to round but not a disk; geodesics that coalesce (no bi-infinite ones)                                        | yes  |
| 028 | Gaussian moat                     | Gaussian primes in a box, joined when at most $D$ apart; union-find components                       | T2       | For every step bound, components stay bounded: no walk to infinity                                                                | yes  |
| 220 | Random walk in random environment | 2D lattice walkers in a fixed iid environment of biased transition probabilities                     | T3       | Directional transience gives a straight-line drift (ballistic), not $\sqrt t$ spreading                                           | yes  |
| 097 | Steinitz–Bergström signing        | Random unit-vector steps, with signs chosen to keep the partial sum short, beside random signs       | T3       | Balanced partial sums stay within a bounded disk while random signs spread like $\sqrt n$                                         | yes  |
| 143 | Quintic Liénard limit cycles      | $\dot x = y - F(x)$, $\dot y = -x$, $F$ of degree ≤ 5 with coefficient sliders, RK4                  | T3       | Trajectories settle onto at most two limit cycles; sliders create, merge and destroy them                                         | yes  |
| 146 | Chirikov standard map             | $p' = p + K\sin\theta$, $\theta' = \theta + p'$ on the torus, many seeds, orbit points accumulated   | T3       | KAM islands in a chaotic sea that takes over as $K$ grows (positive entropy for large $K$)                                        | no   |

Notes for implementation:

- **218 could be a param on the existing Ising.** A "bond disorder" param with default 0 would
  keep old links unchanged (ADR 0009). The flip-probability table then depends on local bonds, so
  `expNegative` is called per flip or per bond configuration.
- **Cross-browser determinism.** 216, 215 and 146 need trigonometry (ISS-005). The standard map is
  chaotic, so a last-bit difference in `Math.sin` would make a shared link diverge visibly between
  browsers. Use a deterministic polynomial `sin`/`cos`, as `expNegative` does for the Ising model.
- **Palettes.** Angle-valued spins (216) need a cyclic coloring. Classic's hue wheel is cyclic; the
  ramps would need mirroring.
- **097 is an illustration, not the theorem.** The theorem is about every sequence, including
  adversarial ones. Greedy signing of random inputs only illustrates the bounded-versus-$\sqrt n$
  contrast, and the explanation should say so.
- **212 renderer.** It needs a priority-queue (Dijkstra) growth in the worker. Arrival time maps to
  a palette ramp; the geodesic tree is drawn as an overlay.

## Do later (28), by the template they need

- **T1/T2 with new samplers:**
  - **225:** six-vertex heights, converging to a Gaussian free field.
  - **232:** Lipschitz height models.
  - **226:** double dimers, whose loops converge to CLE₄. Dimers can be sampled exactly with
    Wilson's algorithm through Temperley's bijection.
  - **231:** uniform spanning trees via Wilson's algorithm.
  - **224:** Voronoi percolation, needing a raster Voronoi diagram and a Cardy crossing estimate.
  - **213:** critical percolation on $\mathbb Z^3$, needing a 3D voxel renderer.
  - Not separate entries: FK interfaces for 223 via Swendsen–Wang and a Dobrushin boundary.
- **T5 Density image:**
  - **153:** a $\lambda$-sweep image of Bernoulli convolutions by the chaos game, showing singular
    measures at Pisot and Salem reciprocals.
  - **148:** general self-similar measures.
- **T6 Billiards:**
  - **147:** convex tables with visible caustics; the ellipse's are confocal.
  - **150:** irrational triangles, showing mixing of direction and position.
- **T7 Interacting particles:**
  - **090:** repelling particles relaxing to a triangular lattice with defects.
  - **364:** a hard-disk gas whose velocity histogram approaches Maxwell's.
- **T8 Graph processes:**
  - **188:** random triangle removal, with edge count against $n^{3/2}/(2\sqrt2)$.
  - **219:** random regular graph spectra, showing GOE spacing; needs an eigen solver in the
    worker.
- **T9 Statistic vs prediction:**
  - **235:** random k-SAT satisfiable fraction against clause density, near the 3-SAT threshold.
  - **238:** the Thorp shuffle, with total variation against shuffle count.
  - **012:** density of $P^+(n) < P^+(n+1)$ tending to 1/2.
  - **026:** the share of prime gaps larger than $C\log p$.
  - **011:** prime factors of $p-1$ tending to Poisson–Dirichlet.
  - **017:** partial sums of the Flint Hills series.
- **T10 Grid fields:**
  - **375:** Allen–Cahn $\Delta u = u^3 - u$ as a gradient flow; phase separation in 2D, although
    the theorem is in dimension 8.
  - **369:** hot spots, the first Neumann eigenfunction on a drawn simply connected domain.
  - **261:** Anderson localization in 2D.
  - **350:** nodal lines of Laplace eigenfunctions, with length against $\sqrt\lambda$.
- **T11 Hex-lattice paths:**
  - **237:** self-avoiding walks by the pivot algorithm, with diameter against $n^{3/4}$.
  - **230:** SLE, either from the percolation exploration path or by Loewner evolution.
- **T12 Complex plane:**
  - **003:** domain coloring of $\zeta(s)$ with the zero-free half-plane $\Re s > 7/8$ shaded.
- **T13 3D parametric shapes:**
  - **354:** isoperimetric regions of the cubic 3-torus as volume grows: ball, tube, slab, with
    transitions at $4\pi/81$ and $1/\pi$.

## Maybe (36)

- **Loose link or low payoff:**
  - **149:** weakly reversible reaction networks, as a 3D ODE.
  - **227:** Sherrington–Kirkpatrick heat-bath dynamics; there is no geometry to show.
  - **229, 236:** broadcasting and Ising on trees.
  - **228:** 3D pair-potential phase transition.
  - **096:** Gaussian propeller.
  - **262:** sech² solitons.
  - **186:** sharp thresholds in $G(n,p)$.
  - **239:** symmetric sign-matrix singularity; Monte Carlo can only reach small $n$.
  - **024:** counting totients.
  - **021:** Jacobsthal's function.
  - **131, 115, 122:** Markov chains on graphs and tables, and trace reconstruction.
- **The construction may not be explicit:**
  - **076:** ultraflat Littlewood polynomials; the classical flat Rudin–Shapiro polynomials are
    easy.
  - **155:** a 3D aperiodic tile.
  - **191:** Heilbronn point sets.
  - **166, 167, 183:** distance and halving-line extremal sets.
  - **158:** plane coloring; the classical 7-coloring and the unit-distance search are easy.
  - **165:** optimal drawings of $K_n$, which are classical.
  - **179:** Barker sequences.
  - **187:** the Snaky Maker strategy.
  - **025:** short Egyptian fractions.
- **Geometry and analysis that only partly fits 2D:**
  - **087:** Mahler's volume product, as a 2D polygon and its polar.
  - **100:** cylinder coverings of a tetrahedron.
  - **071:** circle domains.
  - **074:** Kakeya (the theorem is in 3D and 4D).
  - **366:** Mumford–Shah segmentation.
  - **373, 374:** optimal transport.
  - **345, 349, 355:** closed geodesics, Clifford minimal surfaces and mean curvature flow.
- **211:** random planar maps and Liouville quantum gravity. Sampling and embedding them is a
  research project in itself.

## Not possible (297)

These are abstract structures, existence results or high-dimensional statements with nothing
faithful to draw.

- **Algebra:** 193–210 (all).
- **Algebraic and complex geometry:** 032–069 (all 36).
- **Combinatorics:** 156, 157, 159, 160, 161, 162, 164, 168, 169, 170, 171, 172, 173, 174, 175,
  176, 177, 178, 180, 181, 182, 184, 185, 189, 190, 192.
- **Convex and metric geometry:** 088, 089, 091, 092, 093, 094, 095, 098, 099, 101.
- **Differential geometry:** 333–344, 346–348, 351–353, 356–361.
- **Dynamical systems:** 144, 145, 151, 152, 154 (abstract ergodic theory).
- **Functional analysis:** 322–332 (all).
- **Group theory:** 246–259 (all).
- **Mathematical logic:** 240–245 (all).
- **Mathematical physics:** 260, 263–284. These are quantum many-body problems, general
  relativity and quantum information.
- **Number theory:** 001, 002, 004–010, 013–016, 018–020, 022, 023, 027, 029–031.
- **Operator algebras:** 285–303 (all).
- **PDE:** 362, 363, 365, 367, 368, 370–372, 376, 377.
- **Probability and statistical mechanics:** 214 (nonamenable graphs), and 217, 221, 222 and 234
  (mean-field spin glasses: free energies with no spatial picture).
- **Real and complex analysis:** 072, 073, 075, 077–086.
- **Theoretical computer science:** 102–114, 116–121, 124–130, 132–142.

## Open questions for the template plan

- **Citations.** CONTRIBUTING asks for verified references. The manuscripts are real and
  linkable, but unrefereed. A proposal for each explanation:
  - cite classical, refereed sources for the model itself;
  - link the openai/math family as "a 2026 manuscript (unrefereed)";
  - note whether its main result is Lean-formalized.
- **Unit of reuse.** Should a drop-in be one model per page, as today, or should a page host
  several models of one template? For example, one lattice page with Ising, Potts, Ashkin–Teller
  and XY as a model select. The second means fewer pages but a schema whose params vary by model.
- **Overlap with existing pages.** Some candidates are variants of what we have: 218 of Ising,
  223 at $q=2$ of Ising, and 212 is percolation's sibling. Decide whether they are params, new
  pages, or both.
