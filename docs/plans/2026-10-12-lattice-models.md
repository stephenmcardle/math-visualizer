# Lattice Models: Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the remaining four "do now" lattice models from the openai/math review: random-bond Ising (218), Ashkin–Teller (233), XY (216) and O(3) (215). Each goes on the lattice template from Plan 1, in the "Lattice spin models" family. A cross-check test confirms that the models which reduce to Ising reproduce it.

**Architecture:** Each model is a `LatticeModel` and a `LatticePainter` in its own folder, like Potts. The new shared pieces are:

- **Deterministic math** in `src/lib/math/`: `sinhPositive`, `bisect`, `cosTurns` and `sinTurns`, plus tables for angles quantized to 1/65536 of a turn.
- **A palette wheel** (`Palette.wheel(count)`) for angle-valued spins.
- **Label caching:** the lattice renderer rewrites its label only after a new sweep or a param change.
- **Shared contract tests** for lattice models.

**Tech Stack:** Next.js 16 static export, TypeScript, PixiJS 8, Vitest (node), Playwright.

**Spec:**

- [docs/plans/2026-10-12-template-system-design.md](2026-10-12-template-system-design.md): T1, the rollout and the rules for every model.
- [docs/research/openai-math-candidates.md](../research/openai-math-candidates.md): the models and the citation decisions.
- ADR 0014, from Plan 1.

**Prototyped:** I ran every code block below in a throwaway worktree on top of Plan 1 (PR #20) before writing this plan.

- `npm run check` passed with 196 unit tests, and `npm run test:e2e` with 27.
- I measured every physics threshold quoted in the tests, and I mutation-checked the new e2e test: it fails when the fix is removed.
- I resolved every reference in the metadata on 2026-10-12, through doi.org or Crossref for DOIs, the arXiv API for arXiv entries, and the openai/math repository for manuscripts. I checked the Ashkin–Teller self-dual curve against the text of Aoun, Dober and Glazman.

**One change from the design doc:**

- **What the design said:** XY and O(3) would need a smaller maximum grid, because floating-point spins at 512² make heavy worker snapshots.
- **What this plan does instead:** it stores directions as 16-bit steps of 1/65536 of a turn. That keeps the state at 1 MB or less at 512², so every lattice model keeps the shared 32–512 grid size. It also makes trigonometry a table lookup and lets vortices be counted exactly.

## Global Constraints

- **Branch:** `feat/lattice-models`, from `main` after PR #20 merges. Never push to `main`; open one PR at the end.
- **Checks on every commit:** `npm run check` and `npm run format:check` pass. Tasks 2–6 change rendering or add pages, so they also need `npm run build` followed by `npm run test:e2e`.
- **Docs in each commit:** update `CHANGELOG.md` (Unreleased) and `docs/STATUS.md` ("Last updated" and test counts) for that commit's change. Task 7 does the ADR and the guides.
- **Commits:** conventional commits, ending with the two attribution lines in the session's instructions.
- **Style:** US spelling. Explanation math is TeX for KaTeX; keep equations narrow, using `aligned` across lines.
- **References:** cite only verified references. Each openai/math manuscript is cited as unrefereed and states its Lean status. For 215, the formalization catalog lists "Exponential decay in two-dimensional classical O(n) models" as formalized; for 216, 218 and 233 it lists none.
- **Pinned replays:** the existing pinned replays (Ising, Potts, percolation, random walk, Lorenz) must pass unchanged. The palette change must not alter `colors()` or `pair`.
- **Simulation math:** use only + − × ÷ and `Math.sqrt` on floats, with randomness only from the state's `Rng`. Exponentials, hyperbolic functions and trigonometry come from `src/lib/math/`.
- **Shared keys within the family:** a key two models share must mean the same thing on both (ADR 0014's family test checks type and range).
  - `temperature`: absolute, 0.5–5, step 0.01, on Ising, XY and O(3).
  - `relativeTemperature`: × Tc, 0.5–2, step 0.01, on Potts, random-bond Ising and Ashkin–Teller.
  - `start`: options `random` and `up` everywhere.

## Review Focus

1. **The palette change alters existing colors, so old links look different.** The existing palette tests pin `colors()` and `pair` for every palette, and Task 2 must pass them unchanged. Only `wheel` is new.
2. **A live param change while paused leaves a stale label, because of label caching.** The e2e test "a live param change while paused redraws the lattice label" (Task 2) fails if the cache ignores param changes; it was mutation-checked.
3. **The XY vortex count is off when two neighbors are exactly half a turn apart.**
   - The two orientations of such an edge count the same way, so vortices and antivortices can differ by one.
   - This is display only, and about 1 in 65536 per bond. It is documented in `countVortices`.
   - The hand-built test in Task 5 uses angles one step away from a half turn. The random-configuration test checks the balance for a fixed seed.
4. **XY and O(3) at 512² can't reach the requested speed.**
   - In the prototype, a sweep took about 4.6 ms (XY) and 5.9 ms (O(3)) at 128², against about 0.55 ms for Ising, so roughly 75–95 ms at 512².
   - The worker runner already slows down instead of falling behind (ADR 0005), and the e2e smoke tests render every page at the default size.
5. **Switching from Ising to XY or O(3) carries `temperature` over.** All three use the same absolute units and range, so a carried 2.27 is valid on XY: there it sits above the vortex transition. The family test (Plan 1) checks that the ranges match.

## File map

| File                                                                                                  | Task | Responsibility                                            |
| ----------------------------------------------------------------------------------------------------- | ---- | --------------------------------------------------------- |
| `src/lib/math/deterministic.ts` (+ test)                                                              | 1    | Adds `sinhPositive`, `bisect`, `cosTurns` and `sinTurns`  |
| `src/lib/math/angles.ts` (+ test)                                                                     | 1    | `ANGLE_STEPS`, `COS`/`SIN` tables, `angleDifference`      |
| `src/lib/rendering/palettes.ts` (+ test)                                                              | 2    | `Palette.wheel(count)`; `lerpHex` exported                |
| `src/templates/lattice/renderer.ts`                                                                   | 2    | Label rewritten only after a sweep or a param change      |
| `e2e/smoke.spec.ts`                                                                                   | 2    | The paused-label test                                     |
| `src/templates/lattice/contract-tests.ts`                                                             | 3    | Shared seeded, batching and worker tests, plus `checksum` |
| `src/visualizations/random-bond-ising/*`                                                              | 3    | Random-bond Ising                                         |
| `src/visualizations/ashkin-teller/*`                                                                  | 4    | Ashkin–Teller                                             |
| `src/visualizations/lattice-models.test.ts`                                                           | 4    | The cross-check against Ising and Yang's formula          |
| `src/visualizations/spin-painters.test.ts`                                                            | 4–6  | Painter tests for the new models                          |
| `src/visualizations/xy-model/*`                                                                       | 5    | XY                                                        |
| `src/visualizations/o3-model/*`                                                                       | 6    | O(3)                                                      |
| `src/visualizations/registry.ts`, `src/workers/simulations.ts`, `src/visualizations/describe.test.ts` | 3–6  | Registration and description tests, one model per task    |
| ADR 0015, README, CLAUDE.md, ROADMAP, ISSUES, design doc                                              | 7    | Docs                                                      |

---

### Task 1: Deterministic trigonometry and quantized angles

**Files:**

- Modify (replace): `src/lib/math/deterministic.ts`, `src/lib/math/deterministic.test.ts`
- Create: `src/lib/math/angles.ts`, `src/lib/math/angles.test.ts`

**Interfaces:**

- Produces from `@/lib/math/deterministic`:
  - `sinhPositive(x)` for x ≥ 0;
  - `bisect(f, lo, hi)`, the root of an increasing `f`, to the last bit;
  - `cosTurns(t)` and `sinTurns(t)`, for `t` in turns.
- Produces from `@/lib/math/angles`:
  - `ANGLE_STEPS` (65536) and `ANGLE_MASK`;
  - `COS` and `SIN`, each a `Float64Array(65536)`;
  - `angleDifference(a, b)`, wrapped to −32768…32767.

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull && git checkout -b feat/lattice-models
```

- [ ] **Step 2: Write the failing tests**

Replace `src/lib/math/deterministic.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

import { bisect, cosTurns, expNegative, sinTurns, sinhPositive } from "@/lib/math/deterministic";

describe("expNegative", () => {
  it("matches Math.exp over the range the simulations use", () => {
    for (let x = 0; x <= 16; x += 0.01) {
      expect(Math.abs(expNegative(x) / Math.exp(-x) - 1)).toBeLessThan(1e-13);
    }
  });
});

describe("sinhPositive", () => {
  it("matches Math.sinh", () => {
    for (let x = 0.01; x <= 12; x += 0.01) {
      expect(Math.abs(sinhPositive(x) / Math.sinh(x) - 1)).toBeLessThan(1e-13);
    }
  });
});

describe("bisect", () => {
  it("finds the root of an increasing function to the last bit", () => {
    expect(bisect((x) => x * x - 2, 0, 2)).toBeCloseTo(Math.SQRT2, 15);
  });
});

describe("cosTurns and sinTurns", () => {
  it("match Math.cos and Math.sin, for any number of turns", () => {
    // 4e-15 rather than 1e-15: Math.cos itself loses that much rounding 2πt for |t| up to 3.
    for (let t = -3; t <= 3; t += 0.0009765) {
      expect(Math.abs(cosTurns(t) - Math.cos(2 * Math.PI * t))).toBeLessThan(4e-15);
      expect(Math.abs(sinTurns(t) - Math.sin(2 * Math.PI * t))).toBeLessThan(4e-15);
    }
  });

  it("are exact at whole quarter turns", () => {
    // `+ 0` turns −0 into 0; the sign of zero doesn't matter here.
    expect([0, 0.25, 0.5, 0.75, 1].map((t) => cosTurns(t) + 0)).toEqual([1, 0, -1, 0, 1]);
    expect([0, 0.25, 0.5, 0.75, 1].map((t) => sinTurns(t) + 0)).toEqual([0, 1, 0, -1, 0]);
  });
});
```

`src/lib/math/angles.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { ANGLE_STEPS, COS, SIN, angleDifference } from "@/lib/math/angles";

describe("quantized angles", () => {
  it("tabulate cos and sin of every step", () => {
    for (let i = 0; i < ANGLE_STEPS; i += 97) {
      const angle = (2 * Math.PI * i) / ANGLE_STEPS;
      expect(Math.abs(COS[i] - Math.cos(angle))).toBeLessThan(1e-15);
      expect(Math.abs(SIN[i] - Math.sin(angle))).toBeLessThan(1e-15);
    }
    expect([COS[0], SIN[ANGLE_STEPS / 4], COS[ANGLE_STEPS / 2]]).toEqual([1, 1, -1]);
  });

  it("wrap differences the shorter way round", () => {
    expect(angleDifference(10, 30)).toBe(20);
    expect(angleDifference(30, 10)).toBe(-20);
    expect(angleDifference(65530, 4)).toBe(10);
    expect(angleDifference(4, 65530)).toBe(-10);
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run src/lib/math`
Expected: FAIL. `sinhPositive`, `bisect`, `cosTurns` and `sinTurns` are not exported, and `@/lib/math/angles` cannot be resolved.

- [ ] **Step 4: Implement**

Replace `src/lib/math/deterministic.ts` with (`expNegative` is unchanged):

```ts
/**
 * Elementary functions built from + − × ÷ only. Browsers must round those
 * identically, but not `Math.exp` and friends (ISS-005), so simulations use
 * these to keep shared links replaying exactly everywhere.
 */

/** e^(-x) for x ≥ 0. */
export function expNegative(x: number): number {
  // e^(-x) = (e^(-r))^(2^k) with r = x / 2^k ≤ 1/2, where a short Taylor series converges.
  let r = x;
  let k = 0;
  while (r > 0.5) {
    r /= 2;
    k++;
  }
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 20; n++) {
    term = (term * -r) / n;
    sum += term;
  }
  for (let i = 0; i < k; i++) sum *= sum;
  return sum;
}

/** sinh(x) for x ≥ 0. */
export function sinhPositive(x: number): number {
  const e = expNegative(x);
  return (1 / e - e) / 2;
}

/**
 * The root of an increasing function between `lo` and `hi` (f(lo) < 0 < f(hi)),
 * by bisection to the last bit.
 */
export function bisect(f: (x: number) => number, lo: number, hi: number): number {
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (mid === lo || mid === hi) break;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const HALF_PI = 1.5707963267948966;

/** Taylor series for |x| ≤ π/4, where 9 terms reach full double precision. */
function sinSeries(x: number): number {
  const x2 = x * x;
  let term = x;
  let sum = x;
  for (let n = 1; n <= 9; n++) {
    term = (-term * x2) / (2 * n * (2 * n + 1));
    sum += term;
  }
  return sum;
}

function cosSeries(x: number): number {
  const x2 = x * x;
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 9; n++) {
    term = (-term * x2) / ((2 * n - 1) * (2 * n));
    sum += term;
  }
  return sum;
}

/**
 * cos and sin of an angle `t` given in turns (1 = 360°). Turns reduce exactly:
 * the whole quarter turns are split off with `Math.floor`, and the rest goes to
 * a series on at most an eighth of a turn.
 */
function quarterTurns(t: number): [quarter: number, cos: number, sin: number] {
  const u = 4 * (t - Math.floor(t));
  const quarter = Math.floor(u);
  const r = u - quarter;
  const cos = r <= 0.5 ? cosSeries(r * HALF_PI) : sinSeries((1 - r) * HALF_PI);
  const sin = r <= 0.5 ? sinSeries(r * HALF_PI) : cosSeries((1 - r) * HALF_PI);
  return [quarter, cos, sin];
}

export function cosTurns(t: number): number {
  const [quarter, cos, sin] = quarterTurns(t);
  return quarter === 0 ? cos : quarter === 1 ? -sin : quarter === 2 ? -cos : sin;
}

export function sinTurns(t: number): number {
  const [quarter, cos, sin] = quarterTurns(t);
  return quarter === 0 ? sin : quarter === 1 ? cos : quarter === 2 ? -sin : -cos;
}
```

`src/lib/math/angles.ts`:

```ts
import { cosTurns, sinTurns } from "@/lib/math/deterministic";

/**
 * Angles as whole steps of 1/65536 turn, stored in a Uint16Array. Arithmetic
 * on steps is exact and wraps with a mask, and cos and sin become lookups in
 * tables built once with deterministic math (ISS-005). 65536 directions are
 * far finer than anything a lattice simulation can resolve.
 */
export const ANGLE_STEPS = 65536;
export const ANGLE_MASK = ANGLE_STEPS - 1;

export const COS = new Float64Array(ANGLE_STEPS);
export const SIN = new Float64Array(ANGLE_STEPS);
for (let i = 0; i < ANGLE_STEPS; i++) {
  COS[i] = cosTurns(i / ANGLE_STEPS);
  SIN[i] = sinTurns(i / ANGLE_STEPS);
}

/** b − a in steps, wrapped to the shorter way round: −32768 to 32767. */
export function angleDifference(a: number, b: number): number {
  return ((b - a + ANGLE_STEPS / 2) & ANGLE_MASK) - ANGLE_STEPS / 2;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/lib/math`
Expected: PASS, 7 tests. The trig tolerance is 4e-15, not 1e-15, because `Math.cos` itself loses about 2e-15 rounding 2πt for |t| up to 3. That's a property of the reference, not of `cosTurns`.

- [ ] **Step 6: Docs and commit**

`docs/STATUS.md`: 149 unit tests. No CHANGELOG entry yet; Task 5's entry covers this.

```bash
npm run check && npm run format:check
git add -A && git commit -m "feat(math): deterministic sinh, bisection, trigonometry and angle tables"
```

---

### Task 2: Palette wheels and label caching

**Files:**

- Modify: `src/lib/rendering/palettes.ts`, `src/lib/rendering/palettes.test.ts`
- Modify: `src/templates/lattice/renderer.ts`
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**

- Produces: `Palette.wheel(count): number[]` on every palette, and `lerpHex(a, b, t)`, now exported.
- Consumes: the lattice renderer from Plan 1.

- [ ] **Step 1: Write the failing tests**

In `src/lib/rendering/palettes.test.ts`, add inside the last `describe` block:

```ts
it("give wheels that close up: Classic turns through every hue, ramps run out and back", () => {
  for (const p of PALETTES) {
    const wheel = p.wheel(64);
    expect(wheel, p.value).toHaveLength(64);
    if (p.value === "classic") {
      expect(wheel[0]).toBe(hslToHex(0, 0.7, 0.52));
      expect(wheel[16]).toBe(hslToHex(90, 0.7, 0.52));
    } else if (p.value === "okabe-ito") {
      expect(new Set(wheel).size).toBe(7);
    } else {
      for (let i = 1; i < 64; i++) expect(wheel[i], `${p.value} ${i}`).toBe(wheel[64 - i]);
    }
  }
});
```

In `e2e/smoke.spec.ts`, before `test("controls write to the URL, and reloading keeps them"`:

```ts
test("a live param change while paused redraws the lattice label", async ({ page }) => {
  // The lattice renderer rewrites its label only after a new sweep or a param change.
  await page.goto("/visualizations/ising-model?seed=7");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Pause" }).click();
  await page.waitForTimeout(300);
  const before = await saveFramePng(page);
  expect((await saveFramePng(page)).equals(before)).toBe(true);
  await page.getByRole("slider", { name: "Temperature" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/temperature=2\.28/);
  // Paused, so the spins are unchanged: only the label ("T = 2.28") can differ.
  await expect.poll(async () => (await saveFramePng(page)).equals(before)).toBe(false);
});
```

- [ ] **Step 2: Run the unit test to verify it fails**

Run: `npx vitest run src/lib/rendering/palettes.test.ts`
Expected: FAIL, because `p.wheel is not a function`.

The e2e test passes against today's renderer, which rewrites the label every frame. It guards the change in Step 3; run it after Step 3.

- [ ] **Step 3: Implement**

`src/lib/rendering/palettes.ts`:

```diff
@@ -1,8 +1,9 @@
 /**
- * Color palettes shared by every visualization (ADR 0013). Each offers two
+ * Color palettes shared by every visualization (ADR 0013). Each offers three
  * views of itself: `colors(count)` gives distinct colors for walkers, clusters
- * or trajectories, and `pair` gives two contrasting colors for two-state
- * pictures such as spins. Colors are 0xRRGGBB numbers in sRGB.
+ * or trajectories, `pair` gives two contrasting colors for two-state pictures
+ * such as spins, and `wheel(count)` gives colors around a closed loop for
+ * angles (ADR 0015). Colors are 0xRRGGBB numbers in sRGB.
  *
  * Pure data and math with no engine imports, so params files (which the
  * worker bundle also loads) can use `paletteParam`.
@@ -17,6 +18,12 @@ export interface Palette {
   colors(count: number): number[];
   /** [first, second] state, e.g. spin up and spin down. */
   pair: readonly [number, number];
+  /**
+   * `count` colors for evenly spaced angles, where the last one meets the first.
+   * Classic is a hue wheel; a ramp runs out and back, so opposite turning
+   * directions share colors.
+   */
+  wheel(count: number): number[];
 }

 const GOLDEN_ANGLE_DEGREES = 137.508;
@@ -33,7 +40,8 @@ export function hslToHex(h: number, s: number, l: number): number {
   return (channel(0) << 16) | (channel(8) << 8) | channel(4);
 }

-function lerpHex(a: number, b: number, t: number): number {
+/** The color a fraction `t` of the way from `a` to `b`, mixing each channel. */
+export function lerpHex(a: number, b: number, t: number): number {
   const mix = (shift: number) => {
     const x = (a >> shift) & 0xff;
     const y = (b >> shift) & 0xff;
@@ -70,6 +78,10 @@ function rampPalette(
         sampleRamp(stops, lo + (hi - lo) * ((i * GOLDEN_FRACTION) % 1)),
       ),
     pair: [sampleRamp(stops, pairAt[0]), sampleRamp(stops, pairAt[1])],
+    wheel: (count) =>
+      Array.from({ length: count }, (_, i) =>
+        sampleRamp(stops, lo + (hi - lo) * (1 - Math.abs((2 * i) / count - 1))),
+      ),
   };
 }

@@ -84,6 +96,9 @@ function listPalette(
     label,
     colors: (count) => Array.from({ length: count }, (_, i) => list[i % list.length]),
     pair,
+    // The list in order, as equal sectors.
+    wheel: (count) =>
+      Array.from({ length: count }, (_, i) => list[Math.floor((i * list.length) / count)]),
   };
 }

@@ -126,6 +141,8 @@ export const PALETTES: readonly Palette[] = [
       ),
     // Orange and blue stay distinct with the common forms of color blindness.
     pair: [0xe8833a, 0x3a76c4],
+    wheel: (count) =>
+      Array.from({ length: count }, (_, i) => hslToHex((360 * i) / count, 0.7, 0.52)),
   },
   listPalette("okabe-ito", "Okabe–Ito (color-blind safe)", OKABE_ITO, [0xe69f00, 0x0072b2]),
   rampPalette("viridis", "Viridis", VIRIDIS, [0.15, 1], [1, 0]),
```

`src/templates/lattice/renderer.ts`. The label is rewritten only when it can change. Without this, the XY model's vortex count (Task 5) would scan every site on every frame.

```diff
@@ -41,6 +41,8 @@ export function createLatticeRenderer<P extends { palette: string }, M>(
     let view = DEFAULT_VIEW;
     let fitScale = 1;
     let drawnSweeps = -1;
+    /** The params the label was last written for; the same object until a param changes. */
+    let labeledParams: P | null = null;

     const applyView = () => {
       const transform = viewTransform(view, context);
@@ -98,13 +100,19 @@ export function createLatticeRenderer<P extends { palette: string }, M>(
           applyPalette(params.palette, state);
           drawnSweeps = -1;
         }
+        let painted = false;
         if (state.sweeps !== drawnSweeps && source) {
           drawnSweeps = state.sweeps;
           painter.paint(state, pixels, table);
           source.update();
+          painted = true;
+        }
+        // Only after a new sweep or a param change (live params such as temperature can change
+        // while paused): some labels, such as the XY model's vortex count, scan every site.
+        if (painted || params !== labeledParams) {
+          labeledParams = params;
+          label.setText(painter.label(state, params));
         }
-        // Live params such as temperature can change while paused.
-        label.setText(painter.label(state, params));
       },

       resize(next: RenderContext) {
```

- [ ] **Step 4: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 150 unit tests. The existing palette tests pass unchanged, so `colors()` and `pair` are untouched.

Run: `npm run build && npm run test:e2e`
Expected: 23 passed, including the new label test.

- [ ] **Step 5: Docs and commit**

`docs/STATUS.md`: 150 unit tests and 23 e2e tests.

```bash
git add -A && git commit -m "feat(palettes): add palette wheels for angles, and redraw lattice labels only on change"
```

---

### Task 3: Random-bond Ising, and shared contract tests

**Files:**

- Create: `src/templates/lattice/contract-tests.ts`
- Create in `src/visualizations/random-bond-ising/`:
  - `params.ts`, `simulation.ts`, `describe.ts`, `painter.ts`, `renderer.ts`;
  - `metadata.ts`, `explanation.mdx`, `definition.ts`;
  - `simulation.test.ts`.
- Modify: `src/visualizations/registry.ts`, `src/workers/simulations.ts` and `src/visualizations/describe.test.ts`.

**Interfaces:**

- Produces:
  - `latticeContractTests(slug, simulation, params, sites)`;
  - `checksum(values)`;
  - `randomBondIsingParams` and `RandomBondIsingFields`;
  - `criticalBeta(disorder)`;
  - `randomBondIsingSimulation`, `randomBondIsingPainter` and `randomBondIsing`.
- Consumes: from Task 1, `bisect`, `sinhPositive` and `expNegative`; from Plan 1, `latticeParams`, `latticeSimulation`, `createLatticeRenderer` and `defineLatticeVisualization`.

Model notes:

- Bonds are J = 1 + εξ, with ξ = ±1 drawn once per run, before the spins. They are stored as `Int8Array`s of ξ for the east and south bond of each site.
- The energy change of a flip is 2(a + ε·b), with a = s·Σ neighbors and b = s·Σ ξ·neighbor, so the acceptance table is 5 × 5.
- T_c comes from the duality condition sinh(2(1+ε)β)·sinh(2(1−ε)β) = 1, solved by `bisect`.
- The temperature param is `relativeTemperature`, as on Potts.
- Measured on a 32² grid with ε = 0.6: |m| ≈ 0.93 at 0.8 T_c and 0.11 at 1.3 T_c.

- [ ] **Step 1: Write the contract helper, params and failing tests**

`src/templates/lattice/contract-tests.ts`. This is test-only code, imported only by `*.test.ts` files:

```ts
import { expect, it } from "vitest";

import { LocalSimulationRunner } from "@/lib/simulation/runner";
import type { Simulation } from "@/lib/simulation/types";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import type { LatticeBase } from "@/templates/lattice/simulation";

/**
 * Tests every lattice model must pass, for use inside a model's `describe`. Only
 * test files import this. `sites` returns the model's per-site data as numbers,
 * so two states can be compared.
 */
export function latticeContractTests<P, S extends LatticeBase>(
  slug: string,
  simulation: Simulation<P, S>,
  params: P,
  sites: (state: S) => number[],
): void {
  const run = (seed: number, sweeps: number) => {
    const state = simulation.create(params, seed);
    for (let i = 0; i < sweeps; i++) simulation.step(state, params);
    return state;
  };

  it("counts sweeps, and is seeded: the same seed replays exactly, a different one doesn't", () => {
    expect(run(7, 10).sweeps).toBe(10);
    expect(sites(run(7, 10))).toEqual(sites(run(7, 10)));
    expect(sites(run(8, 10))).not.toEqual(sites(run(7, 10)));
  });

  it("is independent of how steps are batched", () => {
    const runner = new LocalSimulationRunner(simulation);
    runner.reset(params, 99);
    for (const batch of [1, 0, 4, 2]) runner.advance(params, batch);
    expect(sites(runner.current()!.state)).toEqual(sites(run(99, 7)));
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((name) =>
      name === slug ? (simulation as never) : undefined,
    );
    handle({ type: "reset", slug, params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 4, generation: 1 });
    const response = handle({ type: "advance", params, steps: 3, generation: 1 });
    expect(response?.type).toBe("snapshot");
    expect(sites((response as { state: S }).state)).toEqual(sites(run(99, 7)));
  });
}

/** Σ (i + 1) · value over sites: one number that changes if any site does. */
export function checksum(values: ArrayLike<number>): number {
  let total = 0;
  for (let i = 0; i < values.length; i++) total += (i + 1) * values[i];
  return total;
}
```

`src/visualizations/random-bond-ising/params.ts`:

```ts
import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const randomBondIsingParams = latticeParams({
  disorder: {
    label: "Disorder",
    description:
      "ε: each bond's strength is 1 + ε or 1 − ε, at random. 0 is the ordinary Ising model.",
    min: 0,
    max: 0.9,
    step: 0.05,
    default: 0.3,
  },
  // A multiple of this model's critical temperature, with the same key and range as the
  // Potts model's, since the model switcher carries shared keys over (ADR 0014).
  relativeTemperature: {
    label: "Temperature",
    description: "As a multiple of the critical temperature, so 1 is the phase transition.",
    min: 0.5,
    max: 2,
    step: 0.01,
    default: 1,
    unit: "× Tc",
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random spins (infinitely hot) or every spin up (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
});

export type RandomBondIsingParams = ParamValues<typeof randomBondIsingParams>;
```

`src/visualizations/random-bond-ising/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import {
  randomBondIsingParams,
  type RandomBondIsingParams,
} from "@/visualizations/random-bond-ising/params";
import {
  criticalBeta,
  randomBondIsingSimulation,
  type RandomBondIsingState,
} from "@/visualizations/random-bond-ising/simulation";

const params: RandomBondIsingParams = { ...defaultParams(randomBondIsingParams), side: 32 };

function run(seed: number, sweeps: number, p: RandomBondIsingParams = params) {
  const state = randomBondIsingSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) randomBondIsingSimulation.step(state, p);
  return state;
}

function sum(values: Int8Array): number {
  return values.reduce((total, v) => total + v, 0);
}

describe("random-bond Ising simulation", () => {
  latticeContractTests("random-bond-ising", randomBondIsingSimulation, params, (s) =>
    Array.from(s.spins),
  );

  it("puts the critical point on the self-dual curve, and at Onsager's without disorder", () => {
    expect(criticalBeta(0)).toBeCloseTo(Math.log(1 + Math.SQRT2) / 2, 14);
    for (const e of [0.1, 0.5, 0.9]) {
      const beta = criticalBeta(e);
      expect(Math.sinh(2 * (1 + e) * beta) * Math.sinh(2 * (1 - e) * beta)).toBeCloseTo(1, 12);
    }
  });

  it("draws strong and weak bonds in about equal numbers", () => {
    const state = randomBondIsingSimulation.create({ ...params, side: 64 }, 1);
    expect(state.eastBonds.every((b) => b === 1 || b === -1)).toBe(true);
    expect(Math.abs(sum(state.eastBonds) + sum(state.southBonds))).toBeLessThan(300);
  });

  it("keeps the magnetization equal to the sum of the spins", () => {
    const state = randomBondIsingSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      randomBondIsingSimulation.step(state, params);
      expect(state.magnetization).toBe(sum(state.spins));
    }
  });

  it("orders below the critical temperature and not above it, with strong disorder", () => {
    // Measured on 32 × 32 with ε = 0.6: |m| about 0.93 at 0.8 T_c and below 0.15 at 1.3 T_c.
    const mean = (relativeTemperature: number) => {
      const p = { ...params, disorder: 0.6, relativeTemperature, start: "up" };
      const state = run(1, 300, p);
      let total = 0;
      for (let i = 0; i < 200; i++) {
        randomBondIsingSimulation.step(state, p);
        total += Math.abs(state.magnetization) / state.spins.length;
      }
      return total / 200;
    };

    expect(mean(0.8)).toBeGreaterThan(0.85);
    expect(mean(1.3)).toBeLessThan(0.2);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    randomBondIsingSimulation.step(state, { ...params, relativeTemperature: 2 });
    expect(state.relativeTemperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state: RandomBondIsingState = run(12345, 20);
    expect(state.magnetization).toBe(-302);
    expect(checksum(state.spins)).toBe(-98138);
    expect(checksum(state.eastBonds) + checksum(state.southBonds)).toBe(-4456);
    expect(state.criticalBeta).toBe(0.45374840219490853);
  });
});
```

In `src/visualizations/describe.test.ts`, add the imports and this test at the end of the `describe` block:

```ts
import { describeRandomBondIsing } from "@/visualizations/random-bond-ising/describe";
import { randomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";
```

```ts
it("random-bond Ising: reports the disorder, temperature and share of up spins", () => {
  const params = { ...defaultParams(randomBondIsingParams), side: 16, start: "up" };
  expect(describeRandomBondIsing(randomBondIsingSimulation.create(params, 3), params)).toBe(
    "16 by 16 spins with bond disorder 0.30, at 1.00 times the critical temperature, " +
      "after 0 sweeps. 100% of spins point up.",
  );
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/visualizations/random-bond-ising src/visualizations/describe.test.ts`
Expected: FAIL, because `./simulation` and `./describe` cannot be resolved.

- [ ] **Step 3: Implement the simulation, description, painter and renderer**

`src/visualizations/random-bond-ising/simulation.ts`:

```ts
import { bisect, expNegative, sinhPositive } from "@/lib/math/deterministic";
import { nextFloat } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { RandomBondIsingParams } from "@/visualizations/random-bond-ising/params";

/**
 * The Ising model with random bonds: each bond between neighbors has strength
 * J = 1 + εξ, with ξ = ±1 drawn once per run (quenched disorder). Sampled with
 * the Metropolis algorithm on the lattice template's torus.
 */
export interface RandomBondIsingFields {
  disorder: number;
  /** ξ = ±1 of the bond from each site to its east and to its south neighbor. */
  eastBonds: Int8Array;
  southBonds: Int8Array;
  /** +1 or -1 per site, row-major. */
  spins: Int8Array;
  magnetization: number;
  /** 1/T_c for this disorder, from duality: sinh(2(1+ε)β) · sinh(2(1−ε)β) = 1. */
  criticalBeta: number;
  /** The relative temperature the acceptance table below was computed for. */
  relativeTemperature: number;
  /**
   * Acceptance probabilities by (s·Σ neighbors, s·Σ ξ·neighbor), each −4 to 4 in steps
   * of 2: index ((a + 4) / 2) · 5 + (b + 4) / 2. The energy change is 2(a + ε·b).
   */
  accept: Float64Array;
}

export type RandomBondIsingState = LatticeState<RandomBondIsingFields>;

/**
 * The self-dual point of the square lattice with bond strengths 1 ± ε in equal
 * proportion (Fisch 1978; Kinzel and Domany 1981). With ε = 0 it is Onsager's
 * 1/T_c = ln(1 + √2) / 2.
 */
export function criticalBeta(disorder: number): number {
  const strong = 2 * (1 + disorder);
  const weak = 2 * (1 - disorder);
  return bisect((beta) => sinhPositive(strong * beta) * sinhPositive(weak * beta) - 1, 0, 8);
}

function setTemperature(fields: RandomBondIsingFields, relativeTemperature: number): void {
  fields.relativeTemperature = relativeTemperature;
  const beta = fields.criticalBeta / relativeTemperature;
  for (let a = -4; a <= 4; a += 2) {
    for (let b = -4; b <= 4; b += 2) {
      const delta = 2 * (a + fields.disorder * b);
      fields.accept[((a + 4) / 2) * 5 + (b + 4) / 2] = delta <= 0 ? 1 : expNegative(delta * beta);
    }
  }
}

const randomBondIsingModel: LatticeModel<RandomBondIsingParams, RandomBondIsingFields> = {
  init(side, params, rng) {
    const n = side * side;
    // Bonds first, then spins, all from the run's generator.
    const eastBonds = new Int8Array(n);
    const southBonds = new Int8Array(n);
    for (let i = 0; i < n; i++) {
      eastBonds[i] = nextFloat(rng) < 0.5 ? 1 : -1;
      southBonds[i] = nextFloat(rng) < 0.5 ? 1 : -1;
    }
    const spins = new Int8Array(n);
    let magnetization = 0;
    for (let i = 0; i < n; i++) {
      spins[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      magnetization += spins[i];
    }
    const fields = {
      disorder: params.disorder,
      eastBonds,
      southBonds,
      spins,
      magnetization,
      criticalBeta: criticalBeta(params.disorder),
      relativeTemperature: 0,
      accept: new Float64Array(25),
    };
    setTemperature(fields, params.relativeTemperature);
    return fields;
  },

  prepare(state, params) {
    // Temperature is live: a change applies from the next sweep on.
    if (params.relativeTemperature !== state.relativeTemperature) {
      setTemperature(state, params.relativeTemperature);
    }
  },

  attempt(state, site, north, south, west, east) {
    const { spins, eastBonds, southBonds } = state;
    const s = spins[site];
    const a = s * (spins[north] + spins[south] + spins[west] + spins[east]);
    const b =
      s *
      (southBonds[north] * spins[north] +
        southBonds[site] * spins[south] +
        eastBonds[west] * spins[west] +
        eastBonds[site] * spins[east]);
    if (
      a + state.disorder * b <= 0 ||
      nextFloat(state.rng) < state.accept[((a + 4) / 2) * 5 + (b + 4) / 2]
    ) {
      spins[site] = -s;
      state.magnetization -= 2 * s;
    }
  },
};

export const randomBondIsingSimulation = latticeSimulation(randomBondIsingModel);
```

`src/visualizations/random-bond-ising/describe.ts`:

```ts
import type { RandomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import type { RandomBondIsingState } from "@/visualizations/random-bond-ising/simulation";

export function describeRandomBondIsing(
  state: RandomBondIsingState,
  params: RandomBondIsingParams,
): string {
  const spins = state.spins.length;
  const upPercent = Math.round((100 * (spins + state.magnetization)) / 2 / spins);
  return (
    `${state.side} by ${state.side} spins with bond disorder ${state.disorder.toFixed(2)}, at ` +
    `${params.relativeTemperature.toFixed(2)} times the critical temperature, after ` +
    `${state.sweeps} sweeps. ${upPercent}% of spins point up.`
  );
}
```

`src/visualizations/random-bond-ising/painter.ts`:

```ts
import type { LatticePainter } from "@/templates/lattice/painter";
import type { RandomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import type { RandomBondIsingFields } from "@/visualizations/random-bond-ising/simulation";

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

export const randomBondIsingPainter: LatticePainter<RandomBondIsingParams, RandomBondIsingFields> =
  {
    // Spin up and down take the palette's contrasting pair, as in the Ising model.
    colors: (palette) => palette.pair,

    paint(state, pixels, table) {
      const { spins } = state;
      const up = table[0];
      const down = table[1];
      for (let site = 0; site < pixels.length; site++) pixels[site] = spins[site] > 0 ? up : down;
    },

    label(state, params) {
      const m = state.magnetization / state.spins.length;
      return (
        `T = ${params.relativeTemperature.toFixed(2)} Tc  ε = ${state.disorder.toFixed(2)}\n` +
        `m = ${formatSigned(m)}  sweep ${state.sweeps}`
      );
    },
  };
```

`src/visualizations/random-bond-ising/renderer.ts`:

```ts
import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { randomBondIsingPainter } from "@/visualizations/random-bond-ising/painter";

export const createRandomBondIsingRenderer = createLatticeRenderer(randomBondIsingPainter);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/visualizations/random-bond-ising src/visualizations/describe.test.ts`
Expected: PASS. The pinned run gives m = −302 and `criticalBeta` 0.45374840219490853. If the checksums differ, compare the order of random draws: all bonds (east, then south, per site) come before all spins.

- [ ] **Step 5: Metadata, explanation, definition and registration**

`src/visualizations/random-bond-ising/metadata.ts`:

```ts
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
```

`src/visualizations/random-bond-ising/explanation.mdx`:

```mdx
## What this shows

This is the [Ising model](/visualizations/ising-model) with one change: the
bonds between neighboring spins don't all have the same strength. Each bond is
strong ($1 + \varepsilon$) or weak ($1 - \varepsilon$) with equal chance, decided
once at the start and then fixed. Physicists call this **quenched disorder**: the
spins move, but the bonds never do.

The temperature is shown as a multiple of the critical temperature $T_c$, which
depends on the disorder $\varepsilon$, so the transition is always at 1. The
corner shows the temperature, $\varepsilon$ and the magnetization per spin $m$.

Things to try: at $T = 1\,T_c$, compare $\varepsilon = 0$ (the ordinary Ising
model) with $\varepsilon = 0.3$. The patterns look alike: the claim at the heart
of this page. Then push $\varepsilon$ toward 0.9, where the weak bonds are almost
broken, and watch the domains start to follow the bond pattern.

## How the visualization works

- Each bond's strength is drawn from the seeded generator before the spins, so a
  shared link replays the same bonds and the same run.
- Spins are updated with the **Metropolis algorithm**, as in the Ising model. A
  flip that would raise the energy by $\Delta E$ is accepted with probability
  $e^{-\Delta E/T}$.
- $T_c$ is found by bisection, and every probability uses only addition,
  subtraction, multiplication and division, so runs replay exactly in every
  browser.
- The simulation runs in a Web Worker.

## Parameters

- **Grid size**: spins along each side. Restarts the run.
- **Disorder**: $\varepsilon$, from 0 to 0.9. Restarts the run with new bonds.
- **Temperature**: as a multiple of $T_c$. Applies from the next sweep.
- **Starting spins**: random or all up. Restarts the run.
- **Speed**: sweeps per second. Never changes the results.

## Mathematical background

The energy of a configuration is

$$
H = -\sum_{\langle i, j \rangle} J_{ij}\, s_i s_j,
\qquad J_{ij} = 1 \pm \varepsilon.
$$

With strong and weak bonds in equal proportion, a duality argument (Fisch 1978;
Kinzel and Domany 1981) places the transition where

$$
\sinh\bigl(2(1+\varepsilon)/T_c\bigr)\,\sinh\bigl(2(1-\varepsilon)/T_c\bigr) = 1.
$$

At $\varepsilon = 0$ this gives Onsager's $T_c \approx 2.269$.

For the ordinary Ising model at $T_c$, the boundaries between up and down
regions converge, on large grids, to random curves called SLE$_3$ (Chelkak and
Smirnov). A 2026 manuscript from OpenAI's openai/math collection proves the same
limit for weak disorder of the two-valued kind shown here, for almost every
choice of bonds. It has not been refereed, and its main result is not formalized
in Lean. Those curves are defined with boundary conditions that this page, a grid
that wraps around, doesn't have, so what you see is the spins rather than the
curves.

## References

Full citations are listed below.
```

`src/visualizations/random-bond-ising/definition.ts`:

```ts
import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeRandomBondIsing } from "@/visualizations/random-bond-ising/describe";
import { randomBondIsingMetadata } from "@/visualizations/random-bond-ising/metadata";
import { randomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";

export const randomBondIsing = defineLatticeVisualization({
  metadata: randomBondIsingMetadata,
  params: randomBondIsingParams,
  simulation: randomBondIsingSimulation,
  renderer: () => import("./renderer").then((m) => m.createRandomBondIsingRenderer),
  describe: describeRandomBondIsing,
  explanation: () => import("./explanation.mdx"),
});
```

In `src/visualizations/registry.ts`, import `randomBondIsing` from `@/visualizations/random-bond-ising/definition` (alphabetically, after `pottsModel`) and add it after `pottsModel` in the list. In `src/workers/simulations.ts`, import `randomBondIsingSimulation` and add `"random-bond-ising": randomBondIsingSimulation as Simulation<unknown, unknown>,` after the Potts entry.

- [ ] **Step 6: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 161 unit tests.

Run: `npm run build && npm run test:e2e`
Expected: 24 passed.

Look at `/visualizations/random-bond-ising?seed=7` in both themes, and at `?disorder=0.6`. At 1 Tc the patterns should look like the Ising model's.

- [ ] **Step 7: Docs and commit**

`CHANGELOG.md`, under Unreleased `### Added`:

```md
- **Random-bond Ising model** page: the Ising model with bonds of random strength 1 ± ε, fixed
  for the run, at temperatures relative to its critical point. In the Lattice spin models family.
```

`docs/STATUS.md`: six visualizations; 161 unit tests and 24 e2e tests.

```bash
git add -A && git commit -m "feat(random-bond-ising): add the random-bond Ising model"
```

---

### Task 4: Ashkin–Teller, and the Ising cross-check

**Files:**

- Create in `src/visualizations/ashkin-teller/`:
  - `params.ts`, `simulation.ts`, `describe.ts`, `painter.ts`, `renderer.ts`;
  - `metadata.ts`, `explanation.mdx`, `definition.ts`;
  - `simulation.test.ts`.
- Create: `src/visualizations/lattice-models.test.ts`, `src/visualizations/spin-painters.test.ts`
- Modify: `src/visualizations/registry.ts`, `src/workers/simulations.ts`, `src/visualizations/describe.test.ts`

**Interfaces:**

- Produces: `ashkinTellerParams`, `AshkinTellerFields`, `criticalBeta(coupling)`, `ashkinTellerSimulation`, `ashkinTellerPainter`, `ashkinTeller`.
- Consumes:
  - from Task 1: `bisect`, `sinhPositive` and `expNegative`;
  - from Task 3: `latticeContractTests` and `checksum`;
  - from Plan 1: `distinctColors` and the lattice template.

Model notes:

- **Energy:** −Σ (σσ′ + ττ′ + K·σσ′ττ′).
- **Moves:** each attempt draws `nextInt(rng, 3)` to flip σ, τ or both. Flipping one layer changes the energy by 2(x + K·y), with x that layer's local sum and y the product's. Flipping both changes it by 2(x_σ + x_τ). Each case has its own 5 × 5 table.
- **T_c:** on the self-dual curve sinh(2β) = e^(−2Kβ). Aoun, Dober and Glazman (arXiv 2301.10609) prove that both transitions happen there for 0 ≤ K ≤ 1, which is why the coupling param stops at 1.
- **Checks:** K = 0 gives Onsager's point, and K = 1 gives e^(4β) = 3, the 4-state Potts point.
- **Measured** on a 32² grid with K = 1: |⟨σ⟩| ≈ 0.97 at 0.8 T_c and 0.05 at 1.3 T_c.
- **The cross-check** uses four models that reduce to Ising: Ising itself, Potts with q = 2, random-bond Ising with ε = 0, and Ashkin–Teller with K = 0. Each runs from a cold start on a 32² grid.
  - **Measured:** every model was within 0.002 of Yang's exact magnetization at 0.8 T_c and within 0.01 at 0.9 T_c, and between 0.08 and 0.12 at 1.3 T_c.
  - **Why a cold start:** random starts at 0.9 T_c left long-lived stripes that lowered |m| for some seeds.

- [ ] **Step 1: Write the params and the failing tests**

`src/visualizations/ashkin-teller/params.ts`:

```ts
import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const ashkinTellerParams = latticeParams({
  coupling: {
    label: "Four-spin coupling",
    description:
      "K: how strongly the two Ising layers interact. 0 is two independent Ising models; 1 is the 4-state Potts model.",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.5,
  },
  // Same key and range as the Potts model's: the model switcher carries shared keys over.
  relativeTemperature: {
    label: "Temperature",
    description: "As a multiple of the critical temperature, so 1 is the phase transition.",
    min: 0.5,
    max: 2,
    step: 0.01,
    default: 1,
    unit: "× Tc",
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random spins (infinitely hot) or every spin up in both layers (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
});

export type AshkinTellerParams = ParamValues<typeof ashkinTellerParams>;
```

`src/visualizations/ashkin-teller/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import { ashkinTellerParams, type AshkinTellerParams } from "@/visualizations/ashkin-teller/params";
import {
  ashkinTellerSimulation,
  criticalBeta,
  type AshkinTellerState,
} from "@/visualizations/ashkin-teller/simulation";

const params: AshkinTellerParams = { ...defaultParams(ashkinTellerParams), side: 32 };

function run(seed: number, sweeps: number, p: AshkinTellerParams = params): AshkinTellerState {
  const state = ashkinTellerSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) ashkinTellerSimulation.step(state, p);
  return state;
}

describe("Ashkin–Teller simulation", () => {
  latticeContractTests("ashkin-teller", ashkinTellerSimulation, params, (s) => [
    ...s.sigma,
    ...s.tau,
  ]);

  it("puts the critical point on the self-dual curve, from Ising to 4-state Potts", () => {
    // K = 0: two Ising models. K = 1: the 4-state Potts model, where e^(4β) = 3.
    expect(criticalBeta(0)).toBeCloseTo(Math.log(1 + Math.SQRT2) / 2, 14);
    expect(criticalBeta(1)).toBeCloseTo(Math.log(3) / 4, 14);
    const beta = criticalBeta(0.5);
    expect(Math.sinh(2 * beta)).toBeCloseTo(Math.exp(-beta), 12);
  });

  it("keeps the three sums equal to the spins", () => {
    const state = ashkinTellerSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      ashkinTellerSimulation.step(state, params);
      let sigma = 0;
      let tau = 0;
      let product = 0;
      for (let j = 0; j < state.sigma.length; j++) {
        sigma += state.sigma[j];
        tau += state.tau[j];
        product += state.sigma[j] * state.tau[j];
      }
      expect([state.sigmaSum, state.tauSum, state.productSum]).toEqual([sigma, tau, product]);
    }
  });

  it("orders below the critical temperature and not above it, at the Potts point", () => {
    // Measured on 32 × 32 with K = 1: |⟨σ⟩| about 0.97 at 0.8 T_c and 0.05 at 1.3 T_c.
    const mean = (relativeTemperature: number) => {
      const p = { ...params, coupling: 1, relativeTemperature, start: "up" };
      const state = run(1, 300, p);
      let total = 0;
      for (let i = 0; i < 200; i++) {
        ashkinTellerSimulation.step(state, p);
        total += Math.abs(state.sigmaSum) / state.sigma.length;
      }
      return total / 200;
    };

    expect(mean(0.8)).toBeGreaterThan(0.8);
    expect(mean(1.3)).toBeLessThan(0.2);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    ashkinTellerSimulation.step(state, { ...params, relativeTemperature: 2 });
    expect(state.relativeTemperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    expect([state.sigmaSum, state.tauSum, state.productSum]).toEqual([272, -68, -64]);
    expect([checksum(state.sigma), checksum(state.tau)]).toEqual([89174, 20420]);
    expect(state.criticalBeta).toBe(0.333135959193923);
  });
});
```

`src/visualizations/lattice-models.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { Simulation } from "@/lib/simulation/types";
import { defaultParams } from "@/lib/url-state/params";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";
import { randomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";

/** Onsager's critical temperature of the Ising model. */
const ISING_TC = 2 / Math.log(1 + Math.SQRT2);

/** Yang's spontaneous magnetization of the infinite Ising lattice below T_c. */
function yang(temperature: number): number {
  return Math.pow(1 - Math.pow(Math.sinh(2 / temperature), -4), 1 / 8);
}

/** |magnetization| per site, averaged over 400 sweeps after 300 sweeps of burn-in. */
function meanAbs<P, S>(simulation: Simulation<P, S>, params: P, m: (state: S) => number): number {
  const state = simulation.create(params, 1);
  for (let i = 0; i < 300; i++) simulation.step(state, params);
  let total = 0;
  for (let i = 0; i < 400; i++) {
    simulation.step(state, params);
    total += Math.abs(m(state));
  }
  return total / 400;
}

/**
 * Four models that reduce to the Ising model: Potts with 2 states (at half the
 * temperature), random-bond Ising with no disorder and Ashkin–Teller with no
 * coupling (each layer). Each has its own sampler and its own way of finding T_c,
 * so agreement checks both.
 */
function isingLike(relativeTemperature: number): Record<string, number> {
  const side = 32;
  const start = "up";
  return {
    ising: meanAbs(
      isingSimulation,
      { ...defaultParams(isingParams), side, start, temperature: relativeTemperature * ISING_TC },
      (s) => s.magnetization / s.spins.length,
    ),
    potts: meanAbs(
      pottsSimulation,
      { ...defaultParams(pottsParams), side, start, q: 2, relativeTemperature },
      (s) => (s.counts[0] - s.counts[1]) / s.states.length,
    ),
    randomBond: meanAbs(
      randomBondIsingSimulation,
      { ...defaultParams(randomBondIsingParams), side, start, disorder: 0, relativeTemperature },
      (s) => s.magnetization / s.spins.length,
    ),
    ashkinTeller: meanAbs(
      ashkinTellerSimulation,
      { ...defaultParams(ashkinTellerParams), side, start, coupling: 0, relativeTemperature },
      (s) => s.sigmaSum / s.sigma.length,
    ),
  };
}

describe("models that reduce to the Ising model", () => {
  it("match Yang's magnetization below the critical temperature", () => {
    // Measured: every model within 0.002 of Yang at 0.8 T_c and within 0.01 at 0.9 T_c.
    for (const [r, tolerance] of [
      [0.8, 0.01],
      [0.9, 0.02],
    ]) {
      for (const [model, m] of Object.entries(isingLike(r))) {
        expect(Math.abs(m - yang(r * ISING_TC)), `${model} at ${r} T_c`).toBeLessThan(tolerance);
      }
    }
  });

  it("all lose their magnetization above it", () => {
    // Measured: 0.08 to 0.12 on a 32 × 32 grid at 1.3 T_c, where the infinite lattice has 0.
    for (const [model, m] of Object.entries(isingLike(1.3))) {
      expect(m, model).toBeLessThan(0.15);
    }
  });
});
```

`src/visualizations/spin-painters.test.ts` (Tasks 5 and 6 add to it):

```ts
import { describe, expect, it } from "vitest";

import { PALETTES } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable } from "@/templates/lattice/painter";
import { ashkinTellerPainter } from "@/visualizations/ashkin-teller/painter";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";

describe("spin painters", () => {
  it("Ashkin–Teller: four different colors in every palette", () => {
    const state = ashkinTellerSimulation.create(
      { ...defaultParams(ashkinTellerParams), side: 32 },
      1,
    );
    for (const choice of PALETTES) {
      const table = colorTable(ashkinTellerPainter.colors(choice, state));
      expect(new Set(table).size, choice.value).toBe(4);
    }
  });
});
```

In `src/visualizations/describe.test.ts`, add the imports and the test:

```ts
import { describeAshkinTeller } from "@/visualizations/ashkin-teller/describe";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
```

```ts
it("Ashkin–Teller: reports both layers and how often they agree", () => {
  const params = { ...defaultParams(ashkinTellerParams), side: 16, start: "up" };
  expect(describeAshkinTeller(ashkinTellerSimulation.create(params, 3), params)).toBe(
    "16 by 16 sites with four-spin coupling 0.50, at 1.00 times the critical temperature, " +
      "after 0 sweeps. 100% of σ spins and 100% of τ spins point up, and the two agree " +
      "at 100% of sites.",
  );
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/visualizations/ashkin-teller src/visualizations/lattice-models.test.ts src/visualizations/spin-painters.test.ts src/visualizations/describe.test.ts`
Expected: FAIL, because the Ashkin–Teller `simulation`, `describe` and `painter` modules cannot be resolved.

- [ ] **Step 3: Implement the simulation, description, painter and renderer**

`src/visualizations/ashkin-teller/simulation.ts`:

```ts
import { bisect, expNegative, sinhPositive } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { AshkinTellerParams } from "@/visualizations/ashkin-teller/params";

/**
 * The Ashkin–Teller model: two Ising spins σ and τ per site, with energy
 * −Σ (σσ′ + ττ′ + K·σσ′ττ′) over neighboring pairs. Each Metropolis attempt
 * proposes flipping σ, τ or both, chosen uniformly.
 */
export interface AshkinTellerFields {
  coupling: number;
  sigma: Int8Array;
  tau: Int8Array;
  /** Sums of σ, of τ and of στ over all sites, kept up to date. */
  sigmaSum: number;
  tauSum: number;
  productSum: number;
  /** 1/T_c on the self-dual curve: sinh(2β) = e^(−2Kβ). */
  criticalBeta: number;
  relativeTemperature: number;
  /**
   * Acceptance by (x, y), each −4 to 4 in steps of 2, at index ((x + 4) / 2) · 5 + (y + 4) / 2.
   * `single`: flipping one layer, energy change 2(x + K·y) with x that layer's local sum and y
   * the product's. `both`: flipping both, energy change 2(x + y) with the two layers' sums.
   */
  single: Float64Array;
  both: Float64Array;
}

export type AshkinTellerState = LatticeState<AshkinTellerFields>;

/**
 * The self-dual curve sinh(2β) = e^(−2Kβ), where both transitions happen for
 * 0 ≤ K ≤ 1 (Aoun, Dober and Glazman). K = 0 gives Onsager's Ising point and K = 1
 * the 4-state Potts point.
 */
export function criticalBeta(coupling: number): number {
  return bisect((beta) => sinhPositive(2 * beta) - expNegative(2 * coupling * beta), 0, 4);
}

const index = (x: number, y: number) => ((x + 4) / 2) * 5 + (y + 4) / 2;

function setTemperature(fields: AshkinTellerFields, relativeTemperature: number): void {
  fields.relativeTemperature = relativeTemperature;
  const beta = fields.criticalBeta / relativeTemperature;
  for (let x = -4; x <= 4; x += 2) {
    for (let y = -4; y <= 4; y += 2) {
      const single = 2 * (x + fields.coupling * y);
      const both = 2 * (x + y);
      fields.single[index(x, y)] = single <= 0 ? 1 : expNegative(single * beta);
      fields.both[index(x, y)] = both <= 0 ? 1 : expNegative(both * beta);
    }
  }
}

const ashkinTellerModel: LatticeModel<AshkinTellerParams, AshkinTellerFields> = {
  init(side, params, rng) {
    const n = side * side;
    const sigma = new Int8Array(n);
    const tau = new Int8Array(n);
    let sigmaSum = 0;
    let tauSum = 0;
    let productSum = 0;
    for (let i = 0; i < n; i++) {
      sigma[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      tau[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      sigmaSum += sigma[i];
      tauSum += tau[i];
      productSum += sigma[i] * tau[i];
    }
    const fields = {
      coupling: params.coupling,
      sigma,
      tau,
      sigmaSum,
      tauSum,
      productSum,
      criticalBeta: criticalBeta(params.coupling),
      relativeTemperature: 0,
      single: new Float64Array(25),
      both: new Float64Array(25),
    };
    setTemperature(fields, params.relativeTemperature);
    return fields;
  },

  prepare(state, params) {
    // Temperature is live: a change applies from the next sweep on.
    if (params.relativeTemperature !== state.relativeTemperature) {
      setTemperature(state, params.relativeTemperature);
    }
  },

  attempt(state, site, north, south, west, east) {
    const { sigma, tau, rng } = state;
    const s = sigma[site];
    const t = tau[site];
    const sigmaField = s * (sigma[north] + sigma[south] + sigma[west] + sigma[east]);
    const tauField = t * (tau[north] + tau[south] + tau[west] + tau[east]);
    const productField =
      s *
      t *
      (sigma[north] * tau[north] +
        sigma[south] * tau[south] +
        sigma[west] * tau[west] +
        sigma[east] * tau[east]);
    const move = nextInt(rng, 3);
    let delta: number;
    let accept: number;
    if (move === 0) {
      delta = sigmaField + state.coupling * productField;
      accept = state.single[index(sigmaField, productField)];
    } else if (move === 1) {
      delta = tauField + state.coupling * productField;
      accept = state.single[index(tauField, productField)];
    } else {
      delta = sigmaField + tauField;
      accept = state.both[index(sigmaField, tauField)];
    }
    if (delta > 0 && nextFloat(rng) >= accept) return;
    if (move !== 1) {
      sigma[site] = -s;
      state.sigmaSum -= 2 * s;
    }
    if (move !== 0) {
      tau[site] = -t;
      state.tauSum -= 2 * t;
    }
    // Flipping one layer flips the product; flipping both leaves it.
    if (move !== 2) state.productSum -= 2 * s * t;
  },
};

export const ashkinTellerSimulation = latticeSimulation(ashkinTellerModel);
```

`src/visualizations/ashkin-teller/describe.ts`:

```ts
import type { AshkinTellerParams } from "@/visualizations/ashkin-teller/params";
import type { AshkinTellerState } from "@/visualizations/ashkin-teller/simulation";

export function describeAshkinTeller(state: AshkinTellerState, params: AshkinTellerParams): string {
  const n = state.sigma.length;
  const percent = (sum: number) => Math.round((100 * (n + sum)) / 2 / n);
  return (
    `${state.side} by ${state.side} sites with four-spin coupling ${state.coupling.toFixed(2)}, ` +
    `at ${params.relativeTemperature.toFixed(2)} times the critical temperature, after ` +
    `${state.sweeps} sweeps. ${percent(state.sigmaSum)}% of σ spins and ` +
    `${percent(state.tauSum)}% of τ spins point up, and the two agree at ` +
    `${percent(state.productSum)}% of sites.`
  );
}
```

`src/visualizations/ashkin-teller/painter.ts`:

```ts
import { distinctColors, type LatticePainter } from "@/templates/lattice/painter";
import type { AshkinTellerParams } from "@/visualizations/ashkin-teller/params";
import type { AshkinTellerFields } from "@/visualizations/ashkin-teller/simulation";

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

export const ashkinTellerPainter: LatticePainter<AshkinTellerParams, AshkinTellerFields> = {
  // One color per (σ, τ) pair: (+, +), (−, +), (+, −), (−, −).
  colors: (palette) => distinctColors(palette, 4),

  paint(state, pixels, table) {
    const { sigma, tau } = state;
    for (let site = 0; site < pixels.length; site++) {
      pixels[site] = table[(sigma[site] < 0 ? 1 : 0) + (tau[site] < 0 ? 2 : 0)];
    }
  },

  label(state, params) {
    const n = state.sigma.length;
    return (
      `T = ${params.relativeTemperature.toFixed(2)} Tc  K = ${state.coupling.toFixed(2)}\n` +
      `σ ${formatSigned(state.sigmaSum / n)}  τ ${formatSigned(state.tauSum / n)}  ` +
      `στ ${formatSigned(state.productSum / n)}  sweep ${state.sweeps}`
    );
  },
};
```

`src/visualizations/ashkin-teller/renderer.ts`:

```ts
import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { ashkinTellerPainter } from "@/visualizations/ashkin-teller/painter";

export const createAshkinTellerRenderer = createLatticeRenderer(ashkinTellerPainter);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run the command from Step 2.
Expected: PASS. The pinned run gives sums [272, −68, −64], and the cross-check passes for all four models.

- [ ] **Step 5: Metadata, explanation, definition and registration**

`src/visualizations/ashkin-teller/metadata.ts`:

```ts
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
```

`src/visualizations/ashkin-teller/explanation.mdx`:

```mdx
## What this shows

Each site holds two Ising spins, $\sigma$ and $\tau$, so it is in one of four
states, drawn as four colors. Each layer on its own is an
[Ising model](/visualizations/ising-model). The **four-spin coupling** $K$
rewards neighbors whose $\sigma\tau$ products agree, tying the layers together.

The temperature is shown as a multiple of the critical temperature, which depends
on $K$, so the transition is always at 1:

- At $K = 0$ the layers are independent Ising models.
- At $K = 1$ the model is the [4-state Potts model](/visualizations/potts-model):
  all four colors are equivalent.
- In between, the critical point moves continuously along a line, and the
  pictures at $T_c$ change character along it.

The corner shows the average of $\sigma$, of $\tau$ and of their product.

Things to try: at $T = 1\,T_c$, step $K$ from 0 to 1 and compare the patterns.
Below $T_c$, all three averages move away from 0.

## How the visualization works

- Each Metropolis attempt picks a site at random and proposes flipping
  $\sigma$, $\tau$ or both, with equal chance. A change that would raise the
  energy by $\Delta E$ is accepted with probability $e^{-\Delta E/T}$.
- The critical temperature is found by bisection, and every probability uses
  only addition, subtraction, multiplication and division, so runs replay
  exactly in every browser.
- The simulation runs in a Web Worker.

## Parameters

- **Grid size**: sites along each side. Restarts the run.
- **Four-spin coupling**: $K$, from 0 to 1. Restarts the run.
- **Temperature**: as a multiple of $T_c$. Applies from the next sweep.
- **Starting spins**: random, or all up in both layers. Restarts the run.
- **Speed**: sweeps per second. Never changes the results.

## Mathematical background

The energy of a configuration is

$$
\begin{aligned}
H = -\sum_{\langle i, j \rangle} \bigl(&\sigma_i\sigma_j + \tau_i\tau_j \\
&+ K\,\sigma_i\sigma_j\tau_i\tau_j\bigr).
\end{aligned}
$$

Julius Ashkin and Edward Teller introduced the model in 1943. Its self-dual
curve is

$$
\sinh(2/T) = e^{-2K/T}.
$$

Aoun, Dober and Glazman proved in 2023 that for $0 \le K \le 1$ the transitions of
$\sigma$, $\tau$ and $\sigma\tau$ all happen on this curve, which is how this page
finds $T_c$. At $K = 0$ it gives Onsager's $T_c \approx 2.269$.

Along this critical line, the model's large-scale structure changes
continuously. A 2026 manuscript from OpenAI's openai/math collection identifies
the scaling limit of the model's height function and current clusters along the
whole line, including the Potts endpoint. It has not been refereed, and its main
result is not formalized in Lean. This page shows the spins, not those objects.

## References

Full citations are listed below.
```

`src/visualizations/ashkin-teller/definition.ts`:

```ts
import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeAshkinTeller } from "@/visualizations/ashkin-teller/describe";
import { ashkinTellerMetadata } from "@/visualizations/ashkin-teller/metadata";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";

export const ashkinTeller = defineLatticeVisualization({
  metadata: ashkinTellerMetadata,
  params: ashkinTellerParams,
  simulation: ashkinTellerSimulation,
  renderer: () => import("./renderer").then((m) => m.createAshkinTellerRenderer),
  describe: describeAshkinTeller,
  explanation: () => import("./explanation.mdx"),
});
```

Register it after `randomBondIsing` in `src/visualizations/registry.ts`; the import goes first, alphabetically. In `src/workers/simulations.ts`, add the import and `"ashkin-teller": ashkinTellerSimulation as Simulation<unknown, unknown>,` after the random-bond entry.

- [ ] **Step 6: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 174 unit tests.

Run: `npm run build && npm run test:e2e`
Expected: 25 passed.

Look at `/visualizations/ashkin-teller?seed=7` with `coupling` set to 0, 0.5 and 1, in both themes.

- [ ] **Step 7: Docs and commit**

`CHANGELOG.md`, under Unreleased `### Added`:

```md
- **Ashkin–Teller model** page: two Ising layers coupled by a four-spin interaction, from two
  independent Ising models (K = 0) to the 4-state Potts model (K = 1), at temperatures relative to
  its critical line.
- A cross-check test: Potts with 2 states, random-bond Ising without disorder and Ashkin–Teller
  without coupling all reproduce the Ising model's exact magnetization (Yang) below T_c.
```

`docs/STATUS.md`: seven visualizations; 174 unit tests and 25 e2e tests.

```bash
git add -A && git commit -m "feat(ashkin-teller): add the Ashkin–Teller model and an Ising cross-check"
```

---

### Task 5: The XY model

**Files:**

- Create in `src/visualizations/xy-model/`:
  - `params.ts`, `simulation.ts`, `describe.ts`, `painter.ts`, `renderer.ts`;
  - `metadata.ts`, `explanation.mdx`, `definition.ts`;
  - `simulation.test.ts`.
- Modify:
  - `src/visualizations/spin-painters.test.ts`, `src/visualizations/describe.test.ts`;
  - `src/visualizations/registry.ts`, `src/workers/simulations.ts`.

**Interfaces:**

- Produces: `xyParams`, `XyFields`, `xySimulation`, `countVortices(state)`, `xyPainter` and `xyModel`.
- Consumes:
  - from Task 1, `ANGLE_STEPS`, `ANGLE_MASK`, `COS`, `angleDifference` and `expNegative`;
  - from Task 2, `Palette.wheel`;
  - from Task 3, the contract tests.

Model notes:

- **State:** angles as `Uint16Array` steps.
- **Proposal:** each attempt proposes a uniform new angle with `nextInt(rng, 65536)`. The energy change is Σ over neighbors of [cos(θ − θⱼ) − cos(θ′ − θⱼ)], all from the `COS` table.
- **Acceptance:** `expNegative(ΔE / T)` per attempt, since ΔE takes continuous values.
- **Temperature:** the absolute `temperature` key, the same as Ising's, defaulting to 0.89, near T_BKT ≈ 0.893 (Hasenbusch 2005).
- **Vortices:** counted exactly from wrapped angle differences around each plaquette. The painter labels them.
- **Measured** on a 32² grid from a cold start: about 0.0004 vortices per site at T = 0.7 and 0.07 at T = 1.5.

- [ ] **Step 1: Write the params and the failing tests**

`src/visualizations/xy-model/params.ts`:

```ts
import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const xyParams = latticeParams({
  // Same key and range as the Ising model's absolute temperature (ADR 0014).
  temperature: {
    label: "Temperature",
    description:
      "In units of the coupling between neighbors. The vortex-unbinding transition is at about 0.893.",
    min: 0.5,
    max: 5,
    step: 0.01,
    default: 0.89,
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random directions (infinitely hot) or all pointing the same way (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All aligned (cold start)" },
    ],
    default: "random",
  },
});

export type XyParams = ParamValues<typeof xyParams>;
```

`src/visualizations/xy-model/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { ANGLE_STEPS } from "@/lib/math/angles";
import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import { xyParams, type XyParams } from "@/visualizations/xy-model/params";
import { countVortices, xySimulation, type XyState } from "@/visualizations/xy-model/simulation";

const params: XyParams = { ...defaultParams(xyParams), side: 32 };

function run(seed: number, sweeps: number, p: XyParams = params): XyState {
  const state = xySimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) xySimulation.step(state, p);
  return state;
}

/** Vortices per site, averaged over 200 sweeps after 200 of burn-in. */
function vortexDensity(temperature: number): number {
  const p = { ...params, temperature, start: "up" };
  const state = run(1, 200, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    xySimulation.step(state, p);
    total += countVortices(state).vortices / state.angles.length;
  }
  return total / 200;
}

describe("XY simulation", () => {
  latticeContractTests("xy-model", xySimulation, params, (s) => Array.from(s.angles));

  it("counts a vortex where the angle turns once around a plaquette", () => {
    const state = xySimulation.create({ ...params, side: 4, start: "up" }, 1);
    expect(countVortices(state)).toEqual({ vortices: 0, antivortices: 0 });
    // Going round the top-left plaquette (right, down, left, up) the angle steps a
    // quarter turn each time: one full turn forward. One step short of a half turn at
    // site 5 keeps every difference with the aligned sites unambiguous.
    state.angles.set([0, ANGLE_STEPS / 4], 0);
    state.angles.set([(3 * ANGLE_STEPS) / 4, ANGLE_STEPS / 2 - 1], 4);
    const { vortices, antivortices } = countVortices(state);
    expect(vortices).toBe(1);
    // On a torus the windings add up to zero, so an antivortex forms nearby.
    expect(antivortices).toBe(1);
  });

  it("has as many antivortices as vortices in any configuration on the torus", () => {
    const { vortices, antivortices } = countVortices(run(3, 5));
    expect(vortices).toBeGreaterThan(0);
    expect(antivortices).toBe(vortices);
  });

  it("binds its vortices below the transition and frees them above it", () => {
    // Measured on 32 × 32: about 0.0004 vortices per site at T = 0.7 and 0.07 at T = 1.5.
    expect(vortexDensity(0.7)).toBeLessThan(0.003);
    expect(vortexDensity(1.5)).toBeGreaterThan(0.03);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    xySimulation.step(state, { ...params, temperature: 2 });
    expect(state.temperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    expect(checksum(state.angles)).toBe(16676296176);
    expect(countVortices(state)).toEqual({ vortices: 22, antivortices: 22 });
  });
});
```

In `src/visualizations/spin-painters.test.ts`, add the imports `ANGLE_STEPS` (from `@/lib/math/angles`), `palette` (beside `PALETTES`), `packPixel` (beside `colorTable`), `xyPainter`, `xyParams` and `xySimulation`, then this test:

```ts
it("XY: colors each angle from the palette's wheel", () => {
  const state = xySimulation.create({ ...defaultParams(xyParams), side: 32, start: "up" }, 1);
  state.angles[1] = ANGLE_STEPS / 4;
  const wheel = palette("classic").wheel(256);
  const table = colorTable(xyPainter.colors(palette("classic"), state));
  const pixels = new Uint32Array(32 * 32);
  xyPainter.paint(state, pixels, table);
  expect([pixels[0], pixels[1]]).toEqual([packPixel(wheel[0]), packPixel(wheel[64])]);
});
```

In `src/visualizations/describe.test.ts`, import `describeXy`, `xyParams` and `xySimulation`, then add:

```ts
it("XY: reports the temperature and the vortex counts", () => {
  const params = { ...defaultParams(xyParams), side: 16, start: "up" };
  expect(describeXy(xySimulation.create(params, 3), params)).toBe(
    "16 by 16 spins at temperature 0.89, after 0 sweeps: 0 vortices and 0 antivortices.",
  );
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/visualizations/xy-model src/visualizations/spin-painters.test.ts src/visualizations/describe.test.ts`
Expected: FAIL, because the XY `simulation`, `describe` and `painter` modules cannot be resolved.

- [ ] **Step 3: Implement the simulation, description, painter and renderer**

`src/visualizations/xy-model/simulation.ts`:

```ts
import { ANGLE_MASK, ANGLE_STEPS, COS, angleDifference } from "@/lib/math/angles";
import { expNegative } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { XyParams } from "@/visualizations/xy-model/params";

/**
 * The planar XY model: a unit vector at angle θ per site, with energy
 * −Σ cos(θ − θ′) over neighboring pairs. Angles are whole steps of 1/65536
 * turn (`src/lib/math/angles.ts`). Each Metropolis attempt proposes a
 * uniformly random new angle.
 */
export interface XyFields {
  /** Angle per site, in steps. */
  angles: Uint16Array;
  /** Live: read from the params before every sweep. */
  temperature: number;
}

export type XyState = LatticeState<XyFields>;

/** One bond's energy change when a spin turns from `current` to `proposal`. */
function bondChange(current: number, proposal: number, neighbor: number): number {
  return COS[(current - neighbor) & ANGLE_MASK] - COS[(proposal - neighbor) & ANGLE_MASK];
}

const xyModel: LatticeModel<XyParams, XyFields> = {
  init(side, params, rng) {
    const angles = new Uint16Array(side * side);
    if (params.start !== "up") {
      for (let i = 0; i < angles.length; i++) angles[i] = nextInt(rng, ANGLE_STEPS);
    }
    return { angles, temperature: params.temperature };
  },

  prepare(state, params) {
    state.temperature = params.temperature;
  },

  attempt(state, site, north, south, west, east) {
    const { angles, rng } = state;
    const current = angles[site];
    const proposal = nextInt(rng, ANGLE_STEPS);
    const delta =
      bondChange(current, proposal, angles[north]) +
      bondChange(current, proposal, angles[south]) +
      bondChange(current, proposal, angles[west]) +
      bondChange(current, proposal, angles[east]);
    if (delta <= 0 || nextFloat(rng) < expNegative(delta / state.temperature)) {
      angles[site] = proposal;
    }
  },
};

export const xySimulation = latticeSimulation(xyModel);

/**
 * Vortices and antivortices: plaquettes around which the angle turns once
 * forward or once back. Exact, because the steps around a plaquette add up to a
 * whole number of turns. On the torus the two counts match, except in the rare
 * case (1 in 65536 per bond) of neighbors exactly half a turn apart, which count
 * as turning back from either side; that only affects the displayed count.
 */
export function countVortices(state: XyState): { vortices: number; antivortices: number } {
  const { side, angles } = state;
  let vortices = 0;
  let antivortices = 0;
  for (let row = 0; row < side; row++) {
    const below = row === side - 1 ? 0 : row + 1;
    for (let col = 0; col < side; col++) {
      const right = col === side - 1 ? 0 : col + 1;
      const a = angles[row * side + col];
      const b = angles[row * side + right];
      const c = angles[below * side + right];
      const d = angles[below * side + col];
      const turn =
        angleDifference(a, b) +
        angleDifference(b, c) +
        angleDifference(c, d) +
        angleDifference(d, a);
      if (turn > 0) vortices++;
      else if (turn < 0) antivortices++;
    }
  }
  return { vortices, antivortices };
}
```

`src/visualizations/xy-model/describe.ts`:

```ts
import type { XyParams } from "@/visualizations/xy-model/params";
import { countVortices, type XyState } from "@/visualizations/xy-model/simulation";

export function describeXy(state: XyState, params: XyParams): string {
  const { vortices, antivortices } = countVortices(state);
  return (
    `${state.side} by ${state.side} spins at temperature ${params.temperature.toFixed(2)}, ` +
    `after ${state.sweeps} sweeps: ${vortices} vortices and ${antivortices} antivortices.`
  );
}
```

`src/visualizations/xy-model/painter.ts`:

```ts
import type { LatticePainter } from "@/templates/lattice/painter";
import type { XyParams } from "@/visualizations/xy-model/params";
import { countVortices, type XyFields } from "@/visualizations/xy-model/simulation";

/** Colors around the wheel; an angle in steps picks its color with `>> SHIFT`. */
const WHEEL_SIZE = 256;
const SHIFT = 8;

export const xyPainter: LatticePainter<XyParams, XyFields> = {
  // Angles are cyclic, so they take the palette's wheel.
  colors: (palette) => palette.wheel(WHEEL_SIZE),

  paint(state, pixels, table) {
    const { angles } = state;
    for (let site = 0; site < pixels.length; site++) pixels[site] = table[angles[site] >> SHIFT];
  },

  label(state, params) {
    const { vortices } = countVortices(state);
    return `T = ${params.temperature.toFixed(2)}\nvortices ${vortices}  sweep ${state.sweeps}`;
  },
};
```

`src/visualizations/xy-model/renderer.ts`:

```ts
import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { xyPainter } from "@/visualizations/xy-model/painter";

export const createXyRenderer = createLatticeRenderer(xyPainter);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run the command from Step 2.
Expected: PASS. The pinned run gives an angle checksum of 16676296176, with 22 vortices and 22 antivortices.

- [ ] **Step 5: Metadata, explanation, definition and registration**

`src/visualizations/xy-model/metadata.ts`:

```ts
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
```

`src/visualizations/xy-model/explanation.mdx`:

```mdx
## What this shows

Each site holds an arrow that can point in any direction in the plane, drawn as
a color around the palette's wheel. Neighboring arrows prefer to point the same
way, and temperature turns them at random.

Unlike the [Ising model](/visualizations/ising-model), the arrows never all line
up at any positive temperature: in two dimensions, slow twists cost too little
energy (the Mermin–Wagner theorem). Instead the transition is about
**vortices**, points the arrows swirl around once, clockwise or counterclockwise:

- Above about $T = 0.893$, vortices and antivortices wander freely and scramble
  the arrows over short distances.
- Below it, they bind into close pairs, and the arrows stay correlated over long
  distances: correlations fall off as a power of distance instead of
  exponentially.

The corner counts vortices; on a grid that wraps around, antivortices always
match them in number. On the Classic palette a vortex is a point where every
color meets. Ramp palettes run out and back around the wheel, so they show
vortices less clearly.

Things to try: start at the default 0.89 and let it settle, then drag the
temperature up to 1.2 and back down to 0.7, watching the vortex count.

## How the visualization works

- Each Metropolis attempt picks a site at random and proposes a new direction,
  uniformly at random. A change that would raise the energy by $\Delta E$ is
  accepted with probability $e^{-\Delta E/T}$.
- Directions are stored as whole steps of $1/65536$ of a turn, far finer than
  the simulation can resolve. Cosines come from a table computed once with only
  addition, subtraction, multiplication and division, so runs replay exactly in
  every browser, and vortices are counted exactly.
- The simulation runs in a Web Worker.

## Parameters

- **Grid size**: sites along each side. Restarts the run.
- **Temperature**: in units of the coupling. Applies from the next sweep.
- **Starting spins**: random directions, or all the same. Restarts the run.
- **Speed**: sweeps per second. Never changes the results.

## Mathematical background

With $\theta_i$ the angle of the arrow at site $i$, the energy is

$$
H = -\sum_{\langle i, j \rangle} \cos(\theta_i - \theta_j).
$$

Berezinskii, and Kosterlitz and Thouless, explained the transition as the
unbinding of vortex pairs, and Fröhlich and Spencer proved in 1981 that it
exists. Numerically it is at $T \approx 0.893$ (Hasenbusch 2005). Just above it,
the correlation length $\xi$ grows extremely fast as $T$ falls, roughly like

$$
\xi \sim \exp\!\bigl(b / \sqrt{T - T_c}\,\bigr).
$$

A 2026 manuscript from OpenAI's openai/math collection proves this form of
the blow-up. It has not been refereed, and its main result is not formalized in
Lean.

## References

Full citations are listed below.
```

`src/visualizations/xy-model/definition.ts`:

```ts
import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeXy } from "@/visualizations/xy-model/describe";
import { xyMetadata } from "@/visualizations/xy-model/metadata";
import { xyParams } from "@/visualizations/xy-model/params";
import { xySimulation } from "@/visualizations/xy-model/simulation";

export const xyModel = defineLatticeVisualization({
  metadata: xyMetadata,
  params: xyParams,
  simulation: xySimulation,
  renderer: () => import("./renderer").then((m) => m.createXyRenderer),
  describe: describeXy,
  explanation: () => import("./explanation.mdx"),
});
```

Register `xyModel` after `ashkinTeller`; its import goes last, alphabetically. In `src/workers/simulations.ts`, add `"xy-model": xySimulation as Simulation<unknown, unknown>,` after the Ashkin–Teller entry.

- [ ] **Step 6: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 185 unit tests.

Run: `npm run build && npm run test:e2e`
Expected: 26 passed.

Look at `/visualizations/xy-model?seed=7&temperature=0.8` and at `?temperature=1.5`. On Classic, vortices are points where every color meets, and the count in the corner should be much higher at 1.5.

- [ ] **Step 7: Docs and commit**

`CHANGELOG.md`, under Unreleased `### Added`:

```md
- **XY model** page: planar spins with the vortex-unbinding (Berezinskii–Kosterlitz–Thouless)
  transition near T = 0.893, a live vortex count, and colors from each palette's new wheel.
  Angles are stored in steps of 1/65536 turn, so shared links replay exactly in every browser.
```

`docs/STATUS.md`: eight visualizations; 185 unit tests and 26 e2e tests.

```bash
git add -A && git commit -m "feat(xy-model): add the XY model with an exact vortex count"
```

---

### Task 6: The O(3) model

**Files:**

- Create in `src/visualizations/o3-model/`:
  - `params.ts`, `simulation.ts`, `describe.ts`, `painter.ts`, `renderer.ts`;
  - `metadata.ts`, `explanation.mdx`, `definition.ts`;
  - `simulation.test.ts`.
- Modify:
  - `src/visualizations/spin-painters.test.ts`, `src/visualizations/describe.test.ts`;
  - `src/visualizations/registry.ts`, `src/workers/simulations.ts`.

**Interfaces:**

- Produces: `o3Params`, `O3Fields`, `HEIGHT`, `RADIUS`, `o3Simulation`, `magnetization(state)`, `o3Painter` and `o3Model`.
- Consumes:
  - from Task 1, `ANGLE_STEPS`, `COS`, `SIN` and `expNegative`;
  - from Task 2, `lerpHex`;
  - from Task 3, the contract tests.

Model notes:

- **State:** a direction is a height step (z in 65536 equal bands) plus a longitude step. Equal bands of height have equal area on the sphere (Archimedes), so uniform steps give uniform directions.
- **Tables:** `HEIGHT` and `RADIUS` are computed once. `Math.sqrt` is correctly rounded everywhere, so it is deterministic.
- **Colors:** by height, blending from the palette's second color (down) through gray to its first (up).
- **Measured** at T = 1 from a cold start: |m| ≈ 0.17 on a 16² grid, 0.085 on 32² and 0.04 on 64². It halves as the side doubles, the signature of exponential decay. At T = 0.5 on 32², |m| ≈ 0.7, because the correlation length exceeds the grid.

- [ ] **Step 1: Write the params and the failing tests**

`src/visualizations/o3-model/params.ts`:

```ts
import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const o3Params = latticeParams({
  // Same key and range as the Ising model's absolute temperature (ADR 0014).
  temperature: {
    label: "Temperature",
    description:
      "In units of the coupling between neighbors. There is no phase transition: the spins never order above zero temperature.",
    min: 0.5,
    max: 5,
    step: 0.01,
    default: 1,
    live: true,
  },
  start: {
    type: "enum",
    label: "Starting spins",
    description: "Random directions (infinitely hot) or all pointing up (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All up (cold start)" },
    ],
    default: "random",
  },
});

export type O3Params = ParamValues<typeof o3Params>;
```

`src/visualizations/o3-model/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { defaultParams } from "@/lib/url-state/params";
import { checksum, latticeContractTests } from "@/templates/lattice/contract-tests";
import { o3Params, type O3Params } from "@/visualizations/o3-model/params";
import {
  HEIGHT,
  RADIUS,
  magnetization,
  o3Simulation,
  type O3State,
} from "@/visualizations/o3-model/simulation";

const params: O3Params = { ...defaultParams(o3Params), side: 32 };

function run(seed: number, sweeps: number, p: O3Params = params): O3State {
  const state = o3Simulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) o3Simulation.step(state, p);
  return state;
}

/** |m| averaged over 200 sweeps after 200 of burn-in, from a cold start. */
function meanMagnetization(temperature: number, side: number): number {
  const p = { ...params, side, temperature, start: "up" };
  const state = run(1, 200, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    o3Simulation.step(state, p);
    total += magnetization(state);
  }
  return total / 200;
}

describe("O(3) simulation", () => {
  latticeContractTests("o3-model", o3Simulation, params, (s) => [...s.heights, ...s.longitudes]);

  it("stores unit vectors, spread evenly over the sphere", () => {
    for (let k = 0; k < HEIGHT.length; k += 101) {
      expect(HEIGHT[k] ** 2 + RADIUS[k] ** 2).toBeCloseTo(1, 14);
    }
    // Uniform random directions average out to nearly nothing.
    expect(magnetization(o3Simulation.create({ ...params, side: 64 }, 1))).toBeLessThan(0.03);
    expect(magnetization(o3Simulation.create({ ...params, start: "up" }, 1))).toBeCloseTo(1, 4);
  });

  it("loses its magnetization as the grid grows: correlations decay exponentially", () => {
    // Measured at T = 1: |m| about 0.17 on 16 × 16, 0.085 on 32 × 32 and 0.04 on 64 × 64.
    expect(meanMagnetization(1, 64)).toBeLessThan(meanMagnetization(1, 16) / 2);
  });

  it("looks ordered at low temperature on a small grid, since the correlation length exceeds it", () => {
    // Measured: about 0.7 at T = 0.5 on 32 × 32.
    expect(meanMagnetization(0.5, 32)).toBeGreaterThan(0.5);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    o3Simulation.step(state, { ...params, temperature: 2 });
    expect(state.temperature).toBe(2);
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    expect([checksum(state.heights), checksum(state.longitudes)]).toEqual([
      16696509262, 15556540896,
    ]);
    expect(magnetization(state)).toBe(0.11403610668833297);
  });
});
```

In `src/visualizations/spin-painters.test.ts`, import `o3Painter`, `o3Params` and `o3Simulation`, then add:

```ts
it("O(3): shades from the second color (down) through gray to the first (up)", () => {
  const state = o3Simulation.create({ ...defaultParams(o3Params), side: 32, start: "up" }, 1);
  const [up, down] = palette("classic").pair;
  const colors = o3Painter.colors(palette("classic"), state);
  // The end shades sit half a shade in from the pure colors, so compare loosely.
  const near = (a: number, b: number) =>
    [16, 8, 0].every((shift) => Math.abs(((a >> shift) & 0xff) - ((b >> shift) & 0xff)) <= 4);
  expect(near(colors[0], down)).toBe(true);
  expect(near(colors[colors.length - 1], up)).toBe(true);
  const table = colorTable(colors);
  const pixels = new Uint32Array(32 * 32);
  o3Painter.paint(state, pixels, table);
  expect(pixels.every((pixel) => pixel === table[table.length - 1])).toBe(true);
});
```

In `src/visualizations/describe.test.ts`, import `describeO3`, `o3Params` and `o3Simulation`, then add:

```ts
it("O(3): reports the temperature and the length of the average spin", () => {
  const params = { ...defaultParams(o3Params), side: 16, start: "up" };
  expect(describeO3(o3Simulation.create(params, 3), params)).toBe(
    "16 by 16 spins at temperature 1.00, after 0 sweeps. The average spin has length 1.000.",
  );
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/visualizations/o3-model src/visualizations/spin-painters.test.ts src/visualizations/describe.test.ts`
Expected: FAIL, because the O(3) `simulation`, `describe` and `painter` modules cannot be resolved.

- [ ] **Step 3: Implement the simulation, description, painter and renderer**

`src/visualizations/o3-model/simulation.ts`:

```ts
import { ANGLE_STEPS, COS, SIN } from "@/lib/math/angles";
import { expNegative } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { O3Params } from "@/visualizations/o3-model/params";

/**
 * The O(3) model (classical Heisenberg model) in two dimensions: a unit vector
 * in space per site, with energy −Σ s·s′ over neighboring pairs. A direction is
 * stored as two 16-bit steps: height z, in 65536 equal bands from −1 to 1, and
 * longitude φ, in 1/65536 turns. Equal bands of height have equal area on the
 * sphere (Archimedes), so a uniform pair of steps is a uniform direction. Each
 * Metropolis attempt proposes a uniformly random new direction.
 */
export interface O3Fields {
  heights: Uint16Array;
  longitudes: Uint16Array;
  /** Live: read from the params before every sweep. */
  temperature: number;
}

export type O3State = LatticeState<O3Fields>;

/** z at the middle of each height band, and the radius √(1 − z²) of its circle. */
export const HEIGHT = new Float64Array(ANGLE_STEPS);
export const RADIUS = new Float64Array(ANGLE_STEPS);
for (let k = 0; k < ANGLE_STEPS; k++) {
  HEIGHT[k] = (2 * k + 1) / ANGLE_STEPS - 1;
  // Math.sqrt is correctly rounded everywhere, unlike Math.sin or Math.exp.
  RADIUS[k] = Math.sqrt(1 - HEIGHT[k] * HEIGHT[k]);
}

const o3Model: LatticeModel<O3Params, O3Fields> = {
  init(side, params, rng) {
    const n = side * side;
    const heights = new Uint16Array(n);
    const longitudes = new Uint16Array(n);
    if (params.start === "up") {
      heights.fill(ANGLE_STEPS - 1);
    } else {
      for (let i = 0; i < n; i++) {
        heights[i] = nextInt(rng, ANGLE_STEPS);
        longitudes[i] = nextInt(rng, ANGLE_STEPS);
      }
    }
    return { heights, longitudes, temperature: params.temperature };
  },

  prepare(state, params) {
    state.temperature = params.temperature;
  },

  attempt(state, site, north, south, west, east) {
    const { heights, longitudes, rng } = state;
    // The neighbors' sum, h; the energy change is −(s′ − s)·h.
    let hx = 0;
    let hy = 0;
    let hz = 0;
    for (let k = 0; k < 4; k++) {
      const j = k === 0 ? north : k === 1 ? south : k === 2 ? west : east;
      const r = RADIUS[heights[j]];
      hx += r * COS[longitudes[j]];
      hy += r * SIN[longitudes[j]];
      hz += HEIGHT[heights[j]];
    }
    const height = nextInt(rng, ANGLE_STEPS);
    const longitude = nextInt(rng, ANGLE_STEPS);
    const r0 = RADIUS[heights[site]];
    const r1 = RADIUS[height];
    const delta =
      (r0 * COS[longitudes[site]] - r1 * COS[longitude]) * hx +
      (r0 * SIN[longitudes[site]] - r1 * SIN[longitude]) * hy +
      (HEIGHT[heights[site]] - HEIGHT[height]) * hz;
    if (delta <= 0 || nextFloat(rng) < expNegative(delta / state.temperature)) {
      heights[site] = height;
      longitudes[site] = longitude;
    }
  },
};

export const o3Simulation = latticeSimulation(o3Model);

/** Length of the average spin, from 0 (no net direction) to 1 (all aligned). */
export function magnetization(state: O3State): number {
  const { heights, longitudes } = state;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < heights.length; i++) {
    const r = RADIUS[heights[i]];
    x += r * COS[longitudes[i]];
    y += r * SIN[longitudes[i]];
    z += HEIGHT[heights[i]];
  }
  return Math.sqrt(x * x + y * y + z * z) / heights.length;
}
```

`src/visualizations/o3-model/describe.ts`:

```ts
import type { O3Params } from "@/visualizations/o3-model/params";
import { magnetization, type O3State } from "@/visualizations/o3-model/simulation";

export function describeO3(state: O3State, params: O3Params): string {
  return (
    `${state.side} by ${state.side} spins at temperature ${params.temperature.toFixed(2)}, ` +
    `after ${state.sweeps} sweeps. The average spin has length ${magnetization(state).toFixed(3)}.`
  );
}
```

`src/visualizations/o3-model/painter.ts`:

```ts
import { lerpHex } from "@/lib/rendering/palettes";
import type { LatticePainter } from "@/templates/lattice/painter";
import type { O3Params } from "@/visualizations/o3-model/params";
import { magnetization, type O3Fields } from "@/visualizations/o3-model/simulation";

/** Shades from down to up; a height in steps picks its shade with `>> SHIFT`. */
const SHADES = 64;
const SHIFT = 10;
/** Spins lying flat, between the two poles, are drawn gray on both themes. */
const MIDDLE = 0x808080;

export const o3Painter: LatticePainter<O3Params, O3Fields> = {
  // Color shows how far a spin points up (the palette's first color) or down (its second).
  colors(palette) {
    const [up, down] = palette.pair;
    return Array.from({ length: SHADES }, (_, i) => {
      const t = (i + 0.5) / SHADES;
      return t < 0.5 ? lerpHex(down, MIDDLE, 2 * t) : lerpHex(MIDDLE, up, 2 * t - 1);
    });
  },

  paint(state, pixels, table) {
    const { heights } = state;
    for (let site = 0; site < pixels.length; site++) pixels[site] = table[heights[site] >> SHIFT];
  },

  label(state, params) {
    return (
      `T = ${params.temperature.toFixed(2)}\n` +
      `|m| = ${magnetization(state).toFixed(3)}  sweep ${state.sweeps}`
    );
  },
};
```

`src/visualizations/o3-model/renderer.ts`:

```ts
import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { o3Painter } from "@/visualizations/o3-model/painter";

export const createO3Renderer = createLatticeRenderer(o3Painter);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run the command from Step 2.
Expected: PASS. The pinned run gives height and longitude checksums of 16696509262 and 15556540896, and |m| = 0.11403610668833297.

- [ ] **Step 5: Metadata, explanation, definition and registration**

`src/visualizations/o3-model/metadata.ts`:

```ts
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
```

`src/visualizations/o3-model/explanation.mdx`:

```mdx
## What this shows

Each site holds an arrow that can point in any direction in space. Color shows
how far it points up (the palette's first color) or down (its second); arrows
lying flat are gray. Neighboring arrows prefer to point the same way, and
temperature turns them at random.

This model has **no phase transition**. At every positive temperature, arrows
far apart are unrelated: agreement decays exponentially with distance, over a
**correlation length** $\xi$. What changes as it cools is how big $\xi$ is: it
grows exponentially in $1/T$.

- At $T = 1$ and above, regions of agreement are a few sites across.
- Toward the lowest temperatures, $\xi$ becomes larger than the grid, and the
  grid looks ordered. That is a finite-size effect, not order: a large enough
  grid would still break up.

The corner shows the length of the average arrow, $|m|$, from 0 to 1. On a
finite grid it is never exactly 0, and it shrinks as the grid grows.

Things to try: compare $T = 1$ and $T = 0.5$ on the largest grid, then compare
the [XY model](/visualizations/xy-model), whose arrows are confined to the plane.

## How the visualization works

- Each Metropolis attempt picks a site at random and proposes a new direction,
  uniformly at random on the sphere. A change that would raise the energy by
  $\Delta E$ is accepted with probability $e^{-\Delta E/T}$.
- A direction is stored as a height and a longitude, each in 65536 steps. Equal
  bands of height have equal area on the sphere (Archimedes), so uniform steps
  give a uniform direction. Cosines and sines come from tables computed with
  only addition, subtraction, multiplication and division, so runs replay
  exactly in every browser.
- The simulation runs in a Web Worker.

## Parameters

- **Grid size**: sites along each side. Restarts the run.
- **Temperature**: in units of the coupling. Applies from the next sweep.
- **Starting spins**: random directions, or all up. Restarts the run.
- **Speed**: sweeps per second. Never changes the results.

## Mathematical background

With $\mathbf{s}_i$ the unit vector at site $i$, the energy is

$$
H = -\sum_{\langle i, j \rangle} \mathbf{s}_i \cdot \mathbf{s}_j.
$$

Mermin and Wagner proved in 1966 that the arrows can't all align at any positive
temperature in two dimensions. That alone allows the XY model's kind of
transition. Polyakov predicted in 1975 that the O(3) model has none: a finite
correlation length at every temperature, growing exponentially as $T \to 0$.

A 2026 manuscript from OpenAI's openai/math collection proves exponential decay of
correlations at every positive temperature, for this model and every O($n$) model
with $n \ge 3$. It has not been refereed, but according to the collection's
catalog its main result is formalized in Lean.

## References

Full citations are listed below.
```

`src/visualizations/o3-model/definition.ts`:

```ts
import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeO3 } from "@/visualizations/o3-model/describe";
import { o3Metadata } from "@/visualizations/o3-model/metadata";
import { o3Params } from "@/visualizations/o3-model/params";
import { o3Simulation } from "@/visualizations/o3-model/simulation";

export const o3Model = defineLatticeVisualization({
  metadata: o3Metadata,
  params: o3Params,
  simulation: o3Simulation,
  renderer: () => import("./renderer").then((m) => m.createO3Renderer),
  describe: describeO3,
  explanation: () => import("./explanation.mdx"),
});
```

Register `o3Model` last in the list. Its import goes alphabetically, after `lorenzAttractor` and before `percolation`. In `src/workers/simulations.ts`, add `"o3-model": o3Simulation as Simulation<unknown, unknown>,` last.

- [ ] **Step 6: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 196 unit tests.

Run: `npm run build && npm run test:e2e`
Expected: 27 passed.

Look at `/visualizations/o3-model?seed=7` at T = 1 and T = 0.5, in both themes. Also look at the six-model switcher at 390 px wide: it wraps onto three rows, with no horizontal scroll.

- [ ] **Step 7: Docs and commit**

`CHANGELOG.md`, under Unreleased `### Added`:

```md
- **O(3) model** page: spins pointing anywhere in space, which never order at a positive
  temperature, unlike the XY model. Colored from down (the palette's second color) through gray
  to up (its first).
```

`docs/STATUS.md`: nine visualizations; 196 unit tests and 27 e2e tests.

```bash
git add -A && git commit -m "feat(o3-model): add the O(3) model"
```

---

### Task 7: ADR 0015, guides and the pull request

**Files:**

- Create: `docs/decisions/0015-continuous-spins.md`
- Modify:
  - `docs/decisions/README.md`, `README.md`, `CLAUDE.md`;
  - `docs/ROADMAP.md`, `docs/ISSUES.md`, `docs/STATUS.md`;
  - `docs/plans/2026-10-12-template-system-design.md`.

- [ ] **Step 1: Write ADR 0015**

`docs/decisions/0015-continuous-spins.md`:

```md
# 0015: Continuous spins: quantized angles, deterministic trigonometry and palette wheels

- **Status:** Accepted
- **Date:** the date of this commit, as YYYY-MM-DD

## Context

The XY and O(3) models need spins that point in any direction. Two problems come with that:

- **Determinism:** `Math.sin` and `Math.cos` may round differently between browsers (ISS-005),
  which would break exact replay of shared links.
- **Snapshot size:** 512² floating-point spins make a several-megabyte worker snapshot every
  frame. The design doc proposed a smaller maximum grid for these models, but that would give
  them a different `side` range from their siblings in the family.

## Decision

- **Quantized directions.** Directions are whole steps of 1/65536 of a turn in `Uint16Array`s
  (`src/lib/math/angles.ts`); O(3) adds a height in 65536 equal-area bands.
  - Angle arithmetic is exact, with wraparound by mask.
  - Cosines and sines are table lookups.
  - XY vortices are counted exactly with integer arithmetic.
  - The state is at most 1 MB at 512², so every lattice model keeps the 32–512 grid.
- **Deterministic math.** The tables are built with `cosTurns` and `sinTurns`
  (`src/lib/math/deterministic.ts`): exact reduction of whole turns, then a Taylor series on at
  most an eighth of a turn, using only + − × ÷. `sinhPositive` and `bisect` find critical points
  the same way.
- **Palette wheels.** `Palette.wheel(count)` gives colors for angles (extending ADR 0013).
  - Classic is a hue wheel.
  - Okabe–Ito is its seven colors in sectors.
  - Ramps run out and back, so they are cyclic but don't tell the two directions of turning
    apart.
- **Label caching.** The lattice renderer rewrites its label only after a new sweep or a param
  change, so labels can afford to scan the lattice.

## Alternatives considered

- **Float64 angles with deterministic `sin`/`cos` per attempt:** about as accurate, but slower,
  and the snapshots are larger.
- **A smaller maximum grid for continuous models:** a `side` range different from the rest of
  the family, and still floating-point state.
- **A fixed hue wheel, ignoring the palette:** the palette control would do nothing on XY.

## Consequences

- 65536 directions is a clock model, not the continuum. At the energies a lattice simulation
  reaches, the difference is far below anything visible; the explanations say so.
- Future models with angles (for example the standard map, Plan 3) can reuse `cosTurns` and
  `sinTurns` or the tables.
- A palette added later must define `wheel`.
```

Add it to the index in `docs/decisions/README.md`, after 0014:

```md
| [0015](0015-continuous-spins.md) | Continuous spins: quantized angles, deterministic trig, wheels | Accepted | (the ADR's date) |
```

- [ ] **Step 2: Update the guides**

`README.md`:

- **Directory structure:** describe `src/lib/math/` as "deterministic math and quantized angles for simulations".
- **Adding a new visualization**, in the lattice paragraph added by Plan 1, append:

```md
Lattice models also get `latticeContractTests` (`src/templates/lattice/contract-tests.ts`) for
the seeded, batching and worker checks; add a pinned replay of your own. For exponentials,
critical points or angles, use `src/lib/math/` (`expNegative`, `sinhPositive`, `bisect`,
`cosTurns`/`sinTurns` and the 1/65536-turn angle tables) rather than `Math.exp` or `Math.sin`,
and color angles with `palette.wheel(n)`.
```

`CLAUDE.md`:

- In the **Colors** bullet, after `(\`.colors(n)\` or \`.pair\`)`, add `, or \`.wheel(n)\` for angles (ADR 0015)`.
- In the **Templates** bullet, add a sentence: "Lattice models share `latticeContractTests` and must use `src/lib/math/` (deterministic exp, sinh, bisection, trig and quantized angles) instead of `Math.exp`/`Math.sin`."

- [ ] **Step 3: Update the project docs**

- **`docs/ROADMAP.md`, Milestone 5:** replace "Remaining lattice models: random-bond Ising, Ashkin–Teller, XY, O(3)" with "✅ Remaining lattice models: random-bond Ising, Ashkin–Teller, XY, O(3) (ADR 0015)".
- **`docs/ISSUES.md`, ISS-005:** add a line dated the day of the commit: "Lattice models now use deterministic math throughout, including trigonometry via `cosTurns`/`sinTurns` and 1/65536-turn angle tables (ADR 0015). The random walk's isotropic mode still uses `Math.cos`/`Math.sin`: changing it would change old links." Keep the status open.
- **`docs/STATUS.md`:** set "In progress" to "Plan 3 (planar-particle template) next", and update "Last updated".
- **`docs/plans/2026-10-12-template-system-design.md`:**
  - Set the Status to "Accepted; Plans 1–2 done".
  - In T1's "Later needs", replace the smaller-maximum-`side` bullet with "Directions are quantized to 1/65536 turn instead (ADR 0015), so XY and O(3) keep the shared grid size."

- [ ] **Step 4: Final check, commit and PR**

```bash
npm run check && npm run format:check && npm run build && npm run test:e2e
git add -A && git commit -m "docs(lattice): record continuous spins in ADR 0015 and the guides"
git push -u origin feat/lattice-models
gh pr create --title "feat(lattice): random-bond Ising, Ashkin–Teller, XY and O(3) models" --body-file pr-body.md
```

Write `pr-body.md` outside the repo, following `.github/pull_request_template.md`:

- **What and why:** Plan 2; the four models; deterministic trig and quantized angles; palette wheels; label caching; the Ising cross-check; ADR 0015.
- **Type:** New visualization, and Feature / infrastructure.
- **Checklist:** tick each item, having checked it.
- **Screenshots:** demo URLs for the four pages.
- **Attribution:** end the body with the attribution lines from the session's instructions.

Expected: CI `check` passes. Leave merging to the maintainer.
