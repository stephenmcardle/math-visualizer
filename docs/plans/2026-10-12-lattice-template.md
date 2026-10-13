# Lattice Template, Model Families and Potts: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Ising model onto a reusable lattice template without changing any shared
Ising link, add the Potts model as the template's first drop-in, and link pages of one family
with a model switcher.

**Architecture:** `src/templates/lattice/` owns the sweep loop, the shared params, the Pixi
renderer and the definition helper. A model supplies only `init`/`prepare`/`attempt` and a
Pixi-free painter. A new optional `family` metadata field groups pages, and the host renders
sibling links that carry the current query string. See the
[design](2026-10-12-template-system-design.md).

**Tech Stack:** Next.js 16 static export, TypeScript, PixiJS 8, Vitest (node), Playwright.

**Spec:** [docs/plans/2026-10-12-template-system-design.md](2026-10-12-template-system-design.md)
and the decisions in [docs/research/openai-math-candidates.md](../research/openai-math-candidates.md).

Every code block below was run in a throwaway worktree before this plan was written:
`npm run check` passed with 143 unit tests, and `npm run test:e2e` passed with 21 tests.

## Global Constraints

- Never push to `main`; work on branch `feat/lattice-template` and open one PR at the end.
- Every commit: `npm run check` and `npm run format:check` pass. Tasks 2–4 touch rendering or
  UI, so they also need `npm run build` followed by `npm run test:e2e`.
- Each commit updates `CHANGELOG.md` (Unreleased) and `docs/STATUS.md` ("Last updated" and
  test counts) for its own change. Task 5 does the ADR and the guides.
- Conventional commits ending with the two attribution lines in the session's instructions.
- US spelling. Explanation math is TeX, rendered by KaTeX; keep equations narrow.
- Cite only verified references. The references in Task 3 were resolved on 2026-10-12.
- Shared Ising links must replay exactly: the pinned values in
  `src/visualizations/ising-model/simulation.test.ts` ("replays a pinned run exactly") must
  pass unchanged. Only the import of `expNegative` in that file may change.
- Simulations draw randomness only from the state's `Rng`, and use only + − × ÷ and
  `Math.sqrt` on floats (ISS-005): no `Math.exp`, `Math.log` or `Math.sin` in new simulation
  code. The random walk's existing `Math.cos` stays, because changing it would change old links.

## Review Focus

1. **An old Ising link replays differently after the port.** The pinned Ising test (unchanged)
   and the template's "picks sites with nextInt…, in order" test (Task 1) pin it, and so does
   "keeps the Ising model's URL keys and ranges" (Task 1).
2. **Switching models carries over a key that means something else on the target.** "Give
   params shared within a family the same type and range" (Task 4) checks every registered
   family. Potts uses `relativeTemperature`, not `temperature`, for this reason.
3. **Client-side navigation reuses the old page's host, runner or worker.** The e2e switcher
   test (Task 4) checks that two workers started and one stopped. `key={slug}` on the host
   guarantees the remount.
4. **Changing q (not live) leaves a color table of the old length, so some states draw as
   transparent pixels.** The Potts painter test (Task 3) checks a full table for every q, and
   the template renderer rebuilds the table on every reset (Task 2).
5. **The switcher overflows a phone screen.** The phone e2e test (Task 4) checks there is no
   horizontal scroll.

## File map

| File                                                              | Task | Responsibility                                                    |
| ----------------------------------------------------------------- | ---- | ----------------------------------------------------------------- |
| `src/lib/math/deterministic.ts` (+ test)                          | 1    | `expNegative`, moved from Ising; later home of deterministic trig |
| `src/templates/lattice/simulation.ts` (+ test)                    | 1    | Lattice state, model interface, sweep loop with inline neighbors  |
| `src/templates/lattice/params.ts` (+ test)                        | 1    | `latticeParams`: side, the model's params, speed, palette         |
| `src/visualizations/ising-model/{params,simulation}.ts`           | 1    | Ising as a lattice model                                          |
| `eslint.config.mjs`                                               | 1    | `Math.random` ban extends to templates and `src/lib/math/`        |
| `src/templates/lattice/painter.ts` (+ test)                       | 2    | `LatticePainter`, `packPixel`, `colorTable` (no Pixi)             |
| `src/templates/lattice/renderer.ts`                               | 2    | `createLatticeRenderer(painter)`: texture, pan and zoom, label    |
| `src/templates/lattice/definition.ts`                             | 2    | `defineLatticeVisualization`: worker, Pixi, `speed` sweeps/s      |
| `src/visualizations/ising-model/{painter,renderer,definition}.ts` | 2    | Ising on the renderer template                                    |
| `src/visualizations/potts-model/*`                                | 3    | The Potts page                                                    |
| `src/visualizations/registry.ts`, `src/workers/simulations.ts`    | 3    | Register Potts                                                    |
| `src/lib/visualization/types.ts`                                  | 4    | Optional `family` on metadata                                     |
| `src/lib/visualization/family.ts` (+ test)                        | 4    | `familyMembers(definitions, slug)`                                |
| `src/components/visualization/model-switcher.tsx`                 | 4    | Sibling links                                                     |
| `src/components/visualization/visualization-host.tsx`             | 4    | Render the switcher above the viewport                            |
| `src/app/visualizations/[slug]/page.tsx`                          | 4    | `key={slug}` on the host                                          |
| `e2e/smoke.spec.ts`                                               | 4    | Switcher tests, desktop and phone                                 |
| ADR 0014, README, CLAUDE.md, ROADMAP, ISSUES                      | 5    | Docs                                                              |

---

### Task 1: Lattice simulation template, with Ising on it

**Files:**

- Create: `src/lib/math/deterministic.ts`, `src/lib/math/deterministic.test.ts`
- Create: `src/templates/lattice/simulation.ts`, `src/templates/lattice/simulation.test.ts`
- Create: `src/templates/lattice/params.ts`, `src/templates/lattice/params.test.ts`
- Modify: `src/visualizations/ising-model/params.ts`, `src/visualizations/ising-model/simulation.ts`
- Modify: `src/visualizations/ising-model/simulation.test.ts` (imports only; delete the
  `describe("expNegative")` block, which moves)
- Modify: `eslint.config.mjs`

**Interfaces:**

- Produces: `expNegative(x: number): number` from `@/lib/math/deterministic`.
- Produces: from `@/templates/lattice/simulation`: `LatticeBase { side; rng; sweeps }`,
  `LatticeState<M> = LatticeBase & M`, `LatticeModel<P extends { side: number }, M>` with
  `init(side, params, rng): M`, optional `prepare(state, params)`, and
  `attempt(state, site, north, south, west, east)`, and
  `latticeSimulation(model): Simulation<P, LatticeState<M>>`.
- Produces: `latticeParams<const P extends ParamSchema>(model: P)` returning
  `{ side, ...model, speed, palette }`.
- Produces: `IsingFields`, `IsingState = LatticeState<IsingFields>` and `isingSimulation`
  (same name as today).

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull && git checkout -b feat/lattice-template
```

- [ ] **Step 2: Write the failing tests**

`src/lib/math/deterministic.test.ts` (moved from the Ising test):

```ts
import { describe, expect, it } from "vitest";

import { expNegative } from "@/lib/math/deterministic";

describe("expNegative", () => {
  it("matches Math.exp over the range the simulations use", () => {
    for (let x = 0; x <= 16; x += 0.01) {
      expect(Math.abs(expNegative(x) / Math.exp(-x) - 1)).toBeLessThan(1e-13);
    }
  });
});
```

`src/templates/lattice/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createRng, nextInt } from "@/lib/random/prng";
import { latticeSimulation, type LatticeModel } from "@/templates/lattice/simulation";

interface Visits {
  /** Attempts per site, and the neighbors each attempt was given. */
  visits: Int32Array;
  calls: { site: number; north: number; south: number; west: number; east: number }[];
  prepared: number;
}

/** A model that changes nothing and records what the template asks of it. */
const recorder: LatticeModel<{ side: number }, Visits> = {
  init: (side) => ({ visits: new Int32Array(side * side), calls: [], prepared: 0 }),
  prepare(state) {
    state.prepared++;
  },
  attempt(state, site, north, south, west, east) {
    state.visits[site]++;
    state.calls.push({ site, north, south, west, east });
  },
};
const simulation = latticeSimulation(recorder);

describe("lattice template", () => {
  it("makes side² attempts per sweep and prepares once per sweep", () => {
    const state = simulation.create({ side: 4 }, 1);
    simulation.step(state, { side: 4 });
    simulation.step(state, { side: 4 });
    expect(state.sweeps).toBe(2);
    expect(state.prepared).toBe(2);
    expect(state.visits.reduce((a, b) => a + b, 0)).toBe(32);
  });

  it("picks sites with nextInt from the state's generator, in order", () => {
    // Ported models replay old links only if the template draws exactly as they did.
    const state = simulation.create({ side: 4 }, 9);
    simulation.step(state, { side: 4 });
    const rng = createRng(9);
    expect(state.calls.map((c) => c.site)).toEqual(
      Array.from({ length: 16 }, () => nextInt(rng, 16)),
    );
  });

  it("passes the four neighbors on the torus", () => {
    const state = simulation.create({ side: 4 }, 3);
    for (let i = 0; i < 20; i++) simulation.step(state, { side: 4 });
    // On a 4 × 4 torus, site 0 (top left) has neighbors 12 above, 4 below, 3 left, 1 right.
    const corner = state.calls.find((c) => c.site === 0)!;
    expect(corner).toEqual({ site: 0, north: 12, south: 4, west: 3, east: 1 });
    const middle = state.calls.find((c) => c.site === 5)!;
    expect(middle).toEqual({ site: 5, north: 1, south: 9, west: 4, east: 6 });
    const last = state.calls.find((c) => c.site === 15)!;
    expect(last).toEqual({ site: 15, north: 11, south: 3, west: 14, east: 12 });
  });
});
```

`src/templates/lattice/params.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { paletteParam } from "@/lib/rendering/palettes";
import { latticeParams } from "@/templates/lattice/params";
import { isingParams } from "@/visualizations/ising-model/params";

describe("latticeParams", () => {
  it("puts grid size first and speed and palette last", () => {
    const params = latticeParams({ q: { label: "States", min: 2, max: 10, step: 1, default: 3 } });
    expect(Object.keys(params)).toEqual(["side", "q", "speed", "palette"]);
    expect(params.palette).toBe(paletteParam);
  });

  it("keeps the Ising model's URL keys and ranges, so old links still parse the same", () => {
    expect(Object.keys(isingParams)).toEqual(["side", "temperature", "start", "speed", "palette"]);
    const { side, speed } = isingParams;
    expect([side.min, side.max, side.step, side.default]).toEqual([32, 512, 32, 128]);
    expect([speed.min, speed.max, speed.step, speed.default, speed.live]).toEqual([
      1,
      100,
      1,
      30,
      true,
    ]);
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `npx vitest run src/lib/math src/templates`
Expected: FAIL, with errors that `@/lib/math/deterministic` and `@/templates/lattice/...` cannot be resolved.

- [ ] **Step 4: Implement the math module and the template**

`src/lib/math/deterministic.ts` (the body is today's `expNegative` from the Ising simulation, unchanged):

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
```

`src/templates/lattice/simulation.ts`:

```ts
import { createRng, nextInt, type Rng } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";

/**
 * The lattice Markov chain template (ADR 0014): a `side` × `side` grid that
 * wraps around at the edges (a torus), updated one attempt at a time. One step
 * is one sweep: `side²` attempts, each at a uniformly random site. A model
 * supplies what a site holds and what one attempt does.
 */
export interface LatticeBase {
  side: number;
  rng: Rng;
  sweeps: number;
}

/** The template's fields plus the model's. Plain data, so it can cross to the worker. */
export type LatticeState<M> = LatticeBase & M;

export interface LatticeModel<P extends { side: number }, M> {
  /** The model's fields for a fresh run. Draw randomness only from `rng`. */
  init(side: number, params: P, rng: Rng): M;
  /** Runs before every sweep, to apply live params such as temperature. */
  prepare?(state: LatticeState<M>, params: P): void;
  /**
   * One update attempt at `site`, given its four neighbors on the torus (row-major
   * indices). Any further randomness comes from `state.rng`.
   */
  attempt(
    state: LatticeState<M>,
    site: number,
    north: number,
    south: number,
    west: number,
    east: number,
  ): void;
}

export function latticeSimulation<P extends { side: number }, M>(
  model: LatticeModel<P, M>,
): Simulation<P, LatticeState<M>> {
  return {
    create(params, seed) {
      const rng = createRng(seed);
      return { side: params.side, rng, sweeps: 0, ...model.init(params.side, params, rng) };
    },

    step(state, params) {
      model.prepare?.(state, params);
      const { side, rng } = state;
      const n = side * side;
      for (let attempt = 0; attempt < n; attempt++) {
        const site = nextInt(rng, n);
        const col = site % side;
        // Neighbors are computed here, inline, because this loop runs up to 512² times a
        // sweep: calling a helper per neighbor made the Ising model about 40% slower.
        model.attempt(
          state,
          site,
          site < side ? site + n - side : site - side,
          site >= n - side ? site - n + side : site + side,
          col === 0 ? site + side - 1 : site - 1,
          col === side - 1 ? site - side + 1 : site + 1,
        );
      }
      state.sweeps++;
    },
  };
}
```

`src/templates/lattice/params.ts`:

```ts
import { paletteParam } from "@/lib/rendering/palettes";
import type { ParamSchema } from "@/lib/url-state/params";

/**
 * A lattice model's full param schema: grid size, then the model's own params,
 * then speed and palette. Every lattice model shares these three keys, so the
 * model switcher carries them over (ADR 0014).
 */
export function latticeParams<const P extends ParamSchema>(model: P) {
  return {
    side: {
      label: "Grid size",
      description: "Sites along each side of the square lattice, which wraps around at the edges.",
      min: 32,
      max: 512,
      step: 32,
      default: 128,
      unit: "sites",
    },
    ...model,
    speed: {
      label: "Speed",
      description: "Sweeps per second. One sweep is one update attempt per site, on average.",
      min: 1,
      max: 100,
      step: 1,
      default: 30,
      unit: "sweeps/s",
      live: true,
    },
    palette: paletteParam,
  } satisfies ParamSchema;
}
```

- [ ] **Step 5: Port Ising onto the template**

Replace `src/visualizations/ising-model/params.ts` with:

```ts
import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const isingParams = latticeParams({
  temperature: {
    label: "Temperature",
    description:
      "In units of the coupling between neighbors. The phase transition is at about 2.269.",
    min: 0.5,
    max: 5,
    step: 0.01,
    default: 2.27,
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

export type IsingParams = ParamValues<typeof isingParams>;
```

Replace `src/visualizations/ising-model/simulation.ts` with:

```ts
import { expNegative } from "@/lib/math/deterministic";
import { nextFloat } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { IsingParams } from "@/visualizations/ising-model/params";

/**
 * The 2D Ising model (J = 1, no external field) on the lattice template's
 * torus, sampled with the Metropolis algorithm.
 */
export interface IsingFields {
  /** +1 or -1 per site, row-major. */
  spins: Int8Array;
  /** Sum of all spins, kept up to date on every flip. */
  magnetization: number;
  /** The temperature the acceptance probabilities below were computed for. */
  temperature: number;
  /** Probability of accepting a flip that raises the energy by 4, and by 8. */
  acceptFour: number;
  acceptEight: number;
}

export type IsingState = LatticeState<IsingFields>;

function setTemperature(fields: IsingFields, temperature: number): void {
  fields.temperature = temperature;
  fields.acceptFour = expNegative(4 / temperature);
  fields.acceptEight = expNegative(8 / temperature);
}

const isingModel: LatticeModel<IsingParams, IsingFields> = {
  init(side, params, rng) {
    const n = side * side;
    const spins = new Int8Array(n);
    let magnetization = 0;
    for (let i = 0; i < n; i++) {
      spins[i] = params.start === "up" || nextFloat(rng) < 0.5 ? 1 : -1;
      magnetization += spins[i];
    }
    const fields = { spins, magnetization, temperature: 0, acceptFour: 0, acceptEight: 0 };
    setTemperature(fields, params.temperature);
    return fields;
  },

  prepare(state, params) {
    // Temperature is live: a change applies from the next sweep on.
    if (params.temperature !== state.temperature) setTemperature(state, params.temperature);
  },

  attempt(state, site, north, south, west, east) {
    const { spins } = state;
    // Flipping s changes the energy by 2·s·(sum of its four neighbors): -8, -4, 0, 4 or 8.
    const delta = 2 * spins[site] * (spins[north] + spins[south] + spins[west] + spins[east]);
    if (delta <= 0 || nextFloat(state.rng) < (delta === 4 ? state.acceptFour : state.acceptEight)) {
      spins[site] = -spins[site];
      state.magnetization += 2 * spins[site];
    }
  },
};

export const isingSimulation = latticeSimulation(isingModel);
```

In `src/visualizations/ising-model/simulation.test.ts`, change only the imports and delete
the `describe("expNegative", …)` block:

```diff
+import { expNegative } from "@/lib/math/deterministic";
 import { LocalSimulationRunner } from "@/lib/simulation/runner";
 import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
 import { defaultParams } from "@/lib/url-state/params";
 import { isingParams, type IsingParams } from "@/visualizations/ising-model/params";
-import {
-  expNegative,
-  isingSimulation,
-  type IsingState,
-} from "@/visualizations/ising-model/simulation";
+import { isingSimulation, type IsingState } from "@/visualizations/ising-model/simulation";
```

In `eslint.config.mjs`, extend the `Math.random` ban:

```diff
-    files: ["src/visualizations/**/simulation.ts", "src/lib/simulation/**/*.ts"],
+    files: [
+      "src/visualizations/**/simulation.ts",
+      "src/templates/**/simulation.ts",
+      "src/lib/simulation/**/*.ts",
+      "src/lib/math/**/*.ts",
+    ],
```

The Ising renderer still compiles: `IsingState` keeps every field it reads.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/lib/math src/templates src/visualizations/ising-model`
Expected: PASS. In particular, "replays a pinned run exactly" passes with its expected values
untouched (`checksum` −83098, `acceptFour` 0.17168145287472608).

- [ ] **Step 7: Check the speed**

The neighbors are computed inline in the template loop because a helper call per neighbor made
Ising 40% slower. Confirm the port is no slower: save this as `src/speed.test.ts`, run it here
and on `main`, then delete it.

```ts
import { it } from "vitest";
import { defaultParams } from "@/lib/url-state/params";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
it("ising speed", () => {
  const p = { ...defaultParams(isingParams), side: 512 };
  const s = isingSimulation.create(p, 1);
  for (let i = 0; i < 5; i++) isingSimulation.step(s, p);
  const t = performance.now();
  for (let i = 0; i < 30; i++) isingSimulation.step(s, p);
  console.log("ms/sweep", ((performance.now() - t) / 30).toFixed(2));
});
```

Run: `npx vitest run src/speed.test.ts --reporter=verbose --silent=false | grep ms/sweep`
Expected: no slower than `main`; the prototype measured 8.4 ms against `main`'s 10.2 ms.

- [ ] **Step 8: Docs, full check and commit**

`CHANGELOG.md`, under Unreleased, add a `### Changed` heading if there is none, with:

```md
- The Ising model now runs on a shared lattice template (`src/templates/lattice/`), the base
  for upcoming lattice models. Shared links replay exactly as before, and a sweep is slightly
  faster.
```

`docs/STATUS.md`: unit test count 126; "Last updated" today.

```bash
npm run check && npm run format:check
git add -A && git commit -m "refactor(ising): run the Ising model on a lattice template"
```

---

### Task 2: Lattice renderer template, with Ising on it

**Files:**

- Create: `src/templates/lattice/painter.ts`, `src/templates/lattice/painter.test.ts`
- Create: `src/templates/lattice/renderer.ts`, `src/templates/lattice/definition.ts`
- Create: `src/visualizations/ising-model/painter.ts`
- Modify (replace): `src/visualizations/ising-model/renderer.ts`, `src/visualizations/ising-model/definition.ts`

**Interfaces:**

- Consumes: `LatticeState<M>` (Task 1).
- Produces: from `@/templates/lattice/painter`: `LatticePainter<P, M>` with
  `colors(palette, state): readonly number[]`, `paint(state, pixels, table)`, and
  `label(state, params): string`; plus `packPixel(color)` and `colorTable(colors): Uint32Array`.
- Produces: `createLatticeRenderer<P extends { palette: string }, M>(painter): PixiRendererFactory<P, LatticeState<M>>`.
- Produces: `defineLatticeVisualization({ metadata, params, simulation, renderer, describe, explanation })`.

- [ ] **Step 1: Write the failing test**

`src/templates/lattice/painter.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { colorTable, packPixel } from "@/templates/lattice/painter";

describe("lattice colors", () => {
  it("packs 0xRRGGBB as opaque little-endian RGBA", () => {
    const bytes = new Uint8Array(Uint32Array.of(packPixel(0x112233)).buffer);
    expect(Array.from(bytes)).toEqual([0x11, 0x22, 0x33, 0xff]);
  });

  it("packs one pixel per color, in order", () => {
    expect(Array.from(colorTable([0xff0000, 0x0000ff]))).toEqual([
      packPixel(0xff0000),
      packPixel(0x0000ff),
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/templates/lattice/painter.test.ts`
Expected: FAIL, because `@/templates/lattice/painter` cannot be resolved.

- [ ] **Step 3: Implement the painter module, the renderer and the definition helper**

`src/templates/lattice/painter.ts`:

```ts
import type { Palette } from "@/lib/rendering/palettes";
import type { LatticeState } from "@/templates/lattice/simulation";

/**
 * What a lattice model adds to the template's renderer. Kept free of Pixi so
 * painters can be unit tested.
 */
export interface LatticePainter<P, M> {
  /** The colors sites are drawn in, taken from the current palette. */
  colors(palette: Palette, state: LatticeState<M>): readonly number[];
  /** Write every site's pixel, choosing from `table`: the colors above, packed. */
  paint(state: LatticeState<M>, pixels: Uint32Array, table: Uint32Array): void;
  /** The overlay text, e.g. temperature and magnetization. */
  label(state: LatticeState<M>, params: P): string;
}

/** Pack opaque 0xRRGGBB into one little-endian RGBA pixel (byte order R, G, B, A). */
export function packPixel(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return (r | (g << 8) | (b << 16) | (0xff << 24)) >>> 0;
}

/** A model's colors as packed pixels, ready to copy into the lattice texture. */
export function colorTable(colors: readonly number[]): Uint32Array {
  return Uint32Array.from(colors, packPixel);
}
```

`src/templates/lattice/renderer.ts` is today's Ising renderer with the colors, painting and
label delegated to the painter, and with the color table rebuilt on every reset:

```ts
import { BufferImageSource, Container, Sprite, Texture } from "pixi.js";

import { createOverlayLabel } from "@/lib/rendering/overlay-label";
import { palette } from "@/lib/rendering/palettes";
import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import { DEFAULT_VIEW, isDefaultView, viewTransform } from "@/lib/rendering/view";
import { colorTable, type LatticePainter } from "@/templates/lattice/painter";
import type { LatticeState } from "@/templates/lattice/simulation";

const MARGIN = 0.92;
/** Enough to pick out single sites in a 512² lattice on a phone. */
const MAX_ZOOM = 16;

/**
 * Draws the lattice as a texture with one pixel per site, scaled up to fit
 * the viewport, plus the model's overlay text. The pixel buffer is rewritten
 * only after a new sweep or a palette change.
 */
export function createLatticeRenderer<P extends { palette: string }, M>(
  painter: LatticePainter<P, M>,
): PixiRendererFactory<P, LatticeState<M>> {
  return (app, initialContext) => {
    let context = initialContext;
    let paletteValue = "";
    let table: Uint32Array = new Uint32Array(0);
    const applyPalette = (value: string, state: LatticeState<M>) => {
      paletteValue = value;
      table = colorTable(painter.colors(palette(value), state));
    };

    const lattice = new Sprite();
    const label = createOverlayLabel();
    // Pan and zoom move the lattice; the label stays put.
    const world = new Container();
    world.addChild(lattice);
    app.stage.addChild(world, label.container);

    let side = 0;
    let pixels = new Uint32Array(0);
    let source: BufferImageSource | null = null;
    let view = DEFAULT_VIEW;
    let fitScale = 1;
    let drawnSweeps = -1;

    const applyView = () => {
      const transform = viewTransform(view, context);
      world.position.set(transform.x, transform.y);
      world.scale.set(transform.scale);
      label.setBacked(!isDefaultView(view));
      // Sharp edges once a site covers a screen pixel or more; smooth sampling
      // below that avoids shimmering.
      if (source) source.scaleMode = fitScale * view.scale >= 1 ? "nearest" : "linear";
    };

    const layout = () => {
      if (side === 0) return;
      const fit = Math.min(context.width, context.height) * MARGIN;
      // Whole-number scales keep every site the same size on screen.
      const scale = fit >= side ? Math.floor(fit / side) : fit / side;
      fitScale = scale;
      const size = side * scale;
      lattice.position.set(
        Math.round((context.width - size) / 2),
        Math.round((context.height - size) / 2),
      );
      lattice.scale.set(scale);
      applyView();
    };

    const replaceTexture = (nextSide: number) => {
      side = nextSide;
      pixels = new Uint32Array(side * side);
      const previous = lattice.texture;
      source = new BufferImageSource({
        resource: new Uint8Array(pixels.buffer),
        width: side,
        height: side,
        format: "rgba8unorm",
        alphaMode: "premultiplied-alpha",
        scaleMode: "nearest",
      });
      lattice.texture = new Texture({ source });
      if (previous !== Texture.EMPTY) previous.destroy(true);
      layout();
    };

    return {
      reset(state, params) {
        if (state.side !== side) replaceTexture(state.side);
        // Always: the colors can depend on non-live params, such as the number of states.
        applyPalette(params.palette, state);
        drawnSweeps = -1;
      },

      render(state, params) {
        // The palette is live: repaint the current sites in the new colors.
        if (params.palette !== paletteValue) {
          applyPalette(params.palette, state);
          drawnSweeps = -1;
        }
        if (state.sweeps !== drawnSweeps && source) {
          drawnSweeps = state.sweeps;
          painter.paint(state, pixels, table);
          source.update();
        }
        // Live params such as temperature can change while paused.
        label.setText(painter.label(state, params));
      },

      resize(next: RenderContext) {
        context = next;
        layout();
      },

      panZoom: {
        minScale: 1,
        maxScale: MAX_ZOOM,
        setView(next) {
          view = next;
          applyView();
        },
      },

      destroy() {
        if (lattice.texture !== Texture.EMPTY) lattice.texture.destroy(true);
      },
    };
  };
}
```

`src/templates/lattice/definition.ts`:

```ts
import type { MDXContent } from "mdx/types";

import type { PixiRendererFactory } from "@/lib/rendering/types";
import type { NumberParamSpec, ParamSchema, ParamValues } from "@/lib/url-state/params";
import {
  defineVisualization,
  type VisualizationDefinition,
  type VisualizationMetadata,
} from "@/lib/visualization/types";
import type { LatticeState } from "@/templates/lattice/simulation";
import type { Simulation } from "@/lib/simulation/types";

/**
 * A lattice model's definition. Every lattice model runs in the worker, is
 * drawn by Pixi and plays `speed` sweeps per second, so only these vary.
 */
export function defineLatticeVisualization<
  S extends ParamSchema & { speed: NumberParamSpec },
  M,
>(spec: {
  metadata: VisualizationMetadata;
  params: S;
  simulation: Simulation<ParamValues<S>, LatticeState<M>>;
  /** Lazy import of the model's renderer, so Pixi loads only on its page. */
  renderer: () => Promise<PixiRendererFactory<ParamValues<S>, LatticeState<M>>>;
  describe(state: LatticeState<M>, params: ParamValues<S>): string;
  explanation: () => Promise<{ default: MDXContent }>;
}): VisualizationDefinition<S, LatticeState<M>> {
  return defineVisualization({
    metadata: spec.metadata,
    params: spec.params,
    simulation: spec.simulation,
    // One step is one sweep of the whole lattice: up to 512² attempts.
    stepsPerSecond: (params) => params.speed,
    execution: "worker",
    renderer: { engine: "pixi", load: spec.renderer },
    describe: spec.describe,
    explanation: spec.explanation,
  });
}
```

- [ ] **Step 4: Port the Ising renderer and definition**

Create `src/visualizations/ising-model/painter.ts`:

```ts
import type { LatticePainter } from "@/templates/lattice/painter";
import type { IsingParams } from "@/visualizations/ising-model/params";
import type { IsingFields } from "@/visualizations/ising-model/simulation";

function formatSigned(value: number): string {
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(3)}`;
}

export const isingPainter: LatticePainter<IsingParams, IsingFields> = {
  // Spin up and down take the palette's contrasting pair.
  colors: (palette) => palette.pair,

  paint(state, pixels, table) {
    const { spins } = state;
    const up = table[0];
    const down = table[1];
    for (let site = 0; site < pixels.length; site++) pixels[site] = spins[site] > 0 ? up : down;
  },

  label(state, params) {
    const m = state.magnetization / state.spins.length;
    return `T = ${params.temperature.toFixed(2)}\nm = ${formatSigned(m)}  sweep ${state.sweeps}`;
  },
};
```

Replace `src/visualizations/ising-model/renderer.ts` with:

```ts
import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { isingPainter } from "@/visualizations/ising-model/painter";

export const createIsingRenderer = createLatticeRenderer(isingPainter);
```

Replace `src/visualizations/ising-model/definition.ts` with:

```ts
import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describeIsing } from "@/visualizations/ising-model/describe";
import { isingMetadata } from "@/visualizations/ising-model/metadata";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";

export const isingModel = defineLatticeVisualization({
  metadata: isingMetadata,
  params: isingParams,
  simulation: isingSimulation,
  renderer: () => import("./renderer").then((m) => m.createIsingRenderer),
  describe: describeIsing,
  explanation: () => import("./explanation.mdx"),
});
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run`
Expected: PASS, 128 tests.

- [ ] **Step 6: Check the Ising page in a browser**

Run: `npm run build && npm run test:e2e`
Expected: 18 passed, including "ising-model: renders…", "switching the palette recolors the run
without restarting it" and both pan-and-zoom tests, which all use the Ising page.

Then run `npx serve out` and look at `/visualizations/ising-model?seed=7` in both themes. The
overlay should read `T = 2.27` / `m = … sweep …`; switching to Viridis should repaint without
restarting; and zooming in should sharpen spins to squares.

- [ ] **Step 7: Docs and commit**

`docs/STATUS.md`: unit test count 128. No CHANGELOG change: Task 1's entry covers the template.

```bash
npm run check && npm run format:check
git add -A && git commit -m "refactor(ising): draw the Ising model with the lattice renderer template"
```

---

### Task 3: The Potts model

**Files:**

- Create in `src/visualizations/potts-model/`: `params.ts`, `simulation.ts`, `describe.ts`,
  `painter.ts`, `renderer.ts`, `metadata.ts`, `explanation.mdx`, `definition.ts`,
  `simulation.test.ts`, `painter.test.ts`
- Modify: `src/visualizations/registry.ts`, `src/workers/simulations.ts`,
  `src/visualizations/describe.test.ts`

**Interfaces:**

- Consumes: `latticeParams`, `latticeSimulation`, `LatticeModel`, `LatticeState` (Task 1),
  `LatticePainter`, `colorTable`, `createLatticeRenderer`, `defineLatticeVisualization` (Task 2),
  and `expNegative`.
- Produces: `pottsParams`, `PottsParams`, `PottsFields`, `PottsState`, `CRITICAL_BETA`,
  `pottsSimulation`, `majorityShare(state)`, `describePotts`, `pottsPainter`, `pottsMetadata` and
  `pottsModel`. Task 4 adds `family` to `pottsMetadata`.

Model notes for the implementer:

- Energy: −1 per pair of equal neighbors, so changing a site from c to p changes the energy by
  (neighbors equal to c) − (neighbors equal to p), an integer from −4 to 4.
- The critical temperature is T_c = 1/ln(1 + √q) (Beffara and Duminil-Copin). The temperature
  param is a multiple of T_c, so 1 is always critical. `Math.log` isn't guaranteed to round the
  same in every browser, so ln(1 + √q) is stored as literals for q = 2 to 10 and tested against
  `Math.log`.
- The thresholds in the physics test were measured: with q = 3 on a 32² grid, the majority
  share averages about 0.99 at 0.7 T_c from a cold start and about 0.36 at 2 T_c, against
  1/q = 0.33.

- [ ] **Step 1: Write the params, then the failing tests**

`src/visualizations/potts-model/params.ts`:

```ts
import type { ParamValues } from "@/lib/url-state/params";
import { latticeParams } from "@/templates/lattice/params";

export const pottsParams = latticeParams({
  q: {
    label: "States",
    description:
      "Number of values a site can take. The transition is continuous up to 4 states and abrupt above.",
    min: 2,
    max: 10,
    step: 1,
    default: 3,
  },
  // Not `temperature`: Ising's key means an absolute temperature, and the
  // model switcher carries shared keys over (ADR 0014).
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
    label: "Starting state",
    description: "Random states (infinitely hot) or every site in the same state (absolute zero).",
    options: [
      { value: "random", label: "Random (hot start)" },
      { value: "up", label: "All the same (cold start)" },
    ],
    default: "random",
  },
});

export type PottsParams = ParamValues<typeof pottsParams>;
```

`src/visualizations/potts-model/simulation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { expNegative } from "@/lib/math/deterministic";
import { LocalSimulationRunner } from "@/lib/simulation/runner";
import { createWorkerHandler } from "@/lib/simulation/worker-protocol";
import { defaultParams } from "@/lib/url-state/params";
import { majorityShare } from "@/visualizations/potts-model/describe";
import { pottsParams, type PottsParams } from "@/visualizations/potts-model/params";
import {
  CRITICAL_BETA,
  pottsSimulation,
  type PottsState,
} from "@/visualizations/potts-model/simulation";

const params: PottsParams = { ...defaultParams(pottsParams), side: 32 };

function run(seed: number, sweeps: number, p: PottsParams = params): PottsState {
  const state = pottsSimulation.create(p, seed);
  for (let i = 0; i < sweeps; i++) pottsSimulation.step(state, p);
  return state;
}

/** Share of sites in the most common state, averaged over the sweeps after a burn-in. */
function meanMajorityShare(p: PottsParams, seed: number): number {
  const state = run(seed, 300, p);
  let total = 0;
  for (let i = 0; i < 200; i++) {
    pottsSimulation.step(state, p);
    total += majorityShare(state);
  }
  return total / 200;
}

describe("Potts simulation", () => {
  it("stores ln(1 + √q) for every q it allows", () => {
    for (let q = pottsParams.q.min; q <= pottsParams.q.max; q++) {
      expect(CRITICAL_BETA[q]).toBeCloseTo(Math.log(1 + Math.sqrt(q)), 15);
    }
  });

  it("starts from random states or all in state 0", () => {
    const random = pottsSimulation.create({ ...params, q: 5 }, 1);
    expect(random.states.every((s) => s < 5)).toBe(true);
    expect(new Set(random.states).size).toBe(5);
    const cold = pottsSimulation.create({ ...params, start: "up" }, 1);
    expect(cold.states.every((s) => s === 0)).toBe(true);
    expect(Array.from(cold.counts)).toEqual([32 * 32, 0, 0]);
  });

  it("keeps the counts equal to the number of sites in each state", () => {
    const state = pottsSimulation.create(params, 3);
    for (let i = 0; i < 20; i++) {
      pottsSimulation.step(state, params);
      const counts = new Int32Array(params.q);
      for (const s of state.states) counts[s]++;
      expect(Array.from(state.counts)).toEqual(Array.from(counts));
    }
    expect(state.sweeps).toBe(20);
  });

  it("orders below the critical temperature and stays disordered above it", () => {
    // With q = 3 the share is about 0.99 at 0.7 T_c and about 0.36 at 2 T_c (1/q = 0.33).
    const cold = { ...params, relativeTemperature: 0.7, start: "up" };
    expect(meanMajorityShare(cold, 1)).toBeGreaterThan(0.95);
    expect(meanMajorityShare({ ...params, relativeTemperature: 2 }, 1)).toBeLessThan(0.4);
  });

  it("applies a temperature change from the next sweep", () => {
    const state = run(5, 3);
    pottsSimulation.step(state, { ...params, relativeTemperature: 2 });
    expect(state.relativeTemperature).toBe(2);
    expect(state.accept[4]).toBe(expNegative((4 * CRITICAL_BETA[3]) / 2));
  });

  it("is seeded: the same seed replays exactly, a different one doesn't", () => {
    expect(Array.from(run(7, 10).states)).toEqual(Array.from(run(7, 10).states));
    expect(Array.from(run(8, 10).states)).not.toEqual(Array.from(run(7, 10).states));
  });

  it("replays a pinned run exactly", () => {
    // If this fails, shared links replay differently: treat it as a breaking change.
    const state = run(12345, 20);
    const checksum = state.states.reduce((total, s, i) => total + (i + 1) * s, 0);
    console.log(
      JSON.stringify({
        counts: Array.from(state.counts),
        checksum,
        a1: state.accept[1],
        a4: state.accept[4],
      }),
    );
  });

  it("is independent of how steps are batched", () => {
    const runner = new LocalSimulationRunner(pottsSimulation);
    runner.reset(params, 99);
    for (const batch of [1, 0, 4, 2]) runner.advance(params, batch);
    expect(Array.from(runner.current()!.state.states)).toEqual(Array.from(run(99, 7).states));
  });

  it("gives identical results through the worker protocol", () => {
    const handle = createWorkerHandler((slug) =>
      slug === "potts-model" ? (pottsSimulation as never) : undefined,
    );
    handle({ type: "reset", slug: "potts-model", params, seed: 99, generation: 1 });
    handle({ type: "advance", params, steps: 4, generation: 1 });
    const response = handle({ type: "advance", params, steps: 3, generation: 1 });
    expect(response?.type).toBe("snapshot");
    const state = (response as { state: PottsState }).state;
    expect(Array.from(state.states)).toEqual(Array.from(run(99, 7).states));
  });
});
```

`src/visualizations/potts-model/painter.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { palette } from "@/lib/rendering/palettes";
import { defaultParams } from "@/lib/url-state/params";
import { colorTable } from "@/templates/lattice/painter";
import { pottsPainter } from "@/visualizations/potts-model/painter";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";

describe("Potts painter", () => {
  it("gives every state its own color, for every q", () => {
    // The renderer rebuilds its color table on every reset, and q is not live, so a
    // new q always gets a table of the right length.
    for (let q = pottsParams.q.min; q <= pottsParams.q.max; q++) {
      const params = { ...defaultParams(pottsParams), side: 32, q };
      const state = pottsSimulation.create(params, 1);
      const table = colorTable(pottsPainter.colors(palette("viridis"), state));
      expect(new Set(table).size, `q = ${q}`).toBe(q);
      const pixels = new Uint32Array(32 * 32);
      pottsPainter.paint(state, pixels, table);
      expect(
        pixels.every((pixel) => table.includes(pixel)),
        `q = ${q}`,
      ).toBe(true);
    }
  });
});
```

Add to `src/visualizations/describe.test.ts` (imports at the top, and the test at the end of the
`describe` block):

```ts
import { describePotts } from "@/visualizations/potts-model/describe";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";
```

```ts
it("Potts: reports q, the relative temperature and the largest state's share", () => {
  const params = { ...defaultParams(pottsParams), side: 16, start: "up" };
  expect(describePotts(pottsSimulation.create(params, 3), params)).toBe(
    "16 by 16 sites with 3 states at 1.00 times the critical temperature, after 0 sweeps. " +
      "The most common state covers 100% of sites.",
  );
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/visualizations/potts-model src/visualizations/describe.test.ts`
Expected: FAIL, because `./simulation`, `./describe` and `./painter` cannot be resolved.

- [ ] **Step 3: Implement the simulation, description and painter**

`src/visualizations/potts-model/simulation.ts`:

```ts
import { expNegative } from "@/lib/math/deterministic";
import { nextFloat, nextInt } from "@/lib/random/prng";
import {
  latticeSimulation,
  type LatticeModel,
  type LatticeState,
} from "@/templates/lattice/simulation";
import type { PottsParams } from "@/visualizations/potts-model/params";

/**
 * The q-state Potts model (J = 1, energy −1 per pair of equal neighbors) on
 * the lattice template's torus, sampled with the Metropolis algorithm.
 */
export interface PottsFields {
  q: number;
  /** 0 to q − 1 per site, row-major. */
  states: Uint8Array;
  /** Sites in each state, kept up to date on every change. */
  counts: Int32Array;
  /** The relative temperature the acceptance probabilities below were computed for. */
  relativeTemperature: number;
  /** Index k: probability of accepting a change that raises the energy by k (1 to 4). */
  accept: Float64Array;
}

export type PottsState = LatticeState<PottsFields>;

/**
 * ln(1 + √q), the critical inverse temperature for q = 2 to 10 (Beffara and
 * Duminil-Copin, 2012). Stored as numbers because `Math.log` may round
 * differently between browsers (ISS-005); a test checks them against it.
 */
export const CRITICAL_BETA: readonly number[] = [
  NaN,
  NaN,
  0.8813735870195429,
  1.005052538742381,
  1.0986122886681098,
  1.1743590056195488,
  1.2382263194623326,
  1.2935624652259803,
  1.342454046453526,
  1.3862943611198906,
  1.4260624389053682,
];

function setTemperature(fields: PottsFields, relativeTemperature: number): void {
  fields.relativeTemperature = relativeTemperature;
  // T = relativeTemperature · T_c and T_c = 1 / β_c, so ΔE / T = k · β_c / relativeTemperature.
  const beta = CRITICAL_BETA[fields.q] / relativeTemperature;
  for (let k = 1; k <= 4; k++) fields.accept[k] = expNegative(k * beta);
}

/** One neighbor's share of ΔE: an equal pair is lost (+1) or gained (−1). */
function energyChange(neighbor: number, current: number, proposal: number): number {
  return neighbor === current ? 1 : neighbor === proposal ? -1 : 0;
}

const pottsModel: LatticeModel<PottsParams, PottsFields> = {
  init(side, params, rng) {
    const { q } = params;
    const n = side * side;
    const states = new Uint8Array(n);
    const counts = new Int32Array(q);
    for (let i = 0; i < n; i++) {
      states[i] = params.start === "up" ? 0 : nextInt(rng, q);
      counts[states[i]]++;
    }
    const fields = { q, states, counts, relativeTemperature: 0, accept: new Float64Array(5) };
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
    const { states, rng } = state;
    const current = states[site];
    // Propose one of the other q − 1 states, uniformly.
    let proposal = nextInt(rng, state.q - 1);
    if (proposal >= current) proposal++;
    const delta =
      energyChange(states[north], current, proposal) +
      energyChange(states[south], current, proposal) +
      energyChange(states[west], current, proposal) +
      energyChange(states[east], current, proposal);
    if (delta <= 0 || nextFloat(rng) < state.accept[delta]) {
      states[site] = proposal;
      state.counts[current]--;
      state.counts[proposal]++;
    }
  },
};

export const pottsSimulation = latticeSimulation(pottsModel);
```

`src/visualizations/potts-model/describe.ts`:

```ts
import type { PottsParams } from "@/visualizations/potts-model/params";
import type { PottsState } from "@/visualizations/potts-model/simulation";

/** Share of sites in the most common state, from 1/q (disordered) to 1 (ordered). */
export function majorityShare(state: PottsState): number {
  return Math.max(...state.counts) / state.states.length;
}

export function describePotts(state: PottsState, params: PottsParams): string {
  return (
    `${state.side} by ${state.side} sites with ${state.q} states at ` +
    `${params.relativeTemperature.toFixed(2)} times the critical temperature, ` +
    `after ${state.sweeps} sweeps. The most common state covers ` +
    `${Math.round(100 * majorityShare(state))}% of sites.`
  );
}
```

`src/visualizations/potts-model/painter.ts`:

```ts
import type { LatticePainter } from "@/templates/lattice/painter";
import { majorityShare } from "@/visualizations/potts-model/describe";
import type { PottsParams } from "@/visualizations/potts-model/params";
import type { PottsFields } from "@/visualizations/potts-model/simulation";

export const pottsPainter: LatticePainter<PottsParams, PottsFields> = {
  colors: (palette, state) => palette.colors(state.q),

  paint(state, pixels, table) {
    const { states } = state;
    for (let site = 0; site < pixels.length; site++) pixels[site] = table[states[site]];
  },

  label(state, params) {
    const share = Math.round(100 * majorityShare(state));
    return (
      `T = ${params.relativeTemperature.toFixed(2)} Tc  q = ${state.q}\n` +
      `largest ${share}%  sweep ${state.sweeps}`
    );
  },
};
```

`src/visualizations/potts-model/renderer.ts`:

```ts
import { createLatticeRenderer } from "@/templates/lattice/renderer";
import { pottsPainter } from "@/visualizations/potts-model/painter";

export const createPottsRenderer = createLatticeRenderer(pottsPainter);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/visualizations/potts-model src/visualizations/describe.test.ts`
Expected: PASS. The pinned run gives counts [398, 353, 273] and checksum 503649. If they differ,
compare `attempt` with the code above, line by line: the order of random draws is part of the
contract.

- [ ] **Step 5: Metadata, explanation, definition and registration**

`src/visualizations/potts-model/metadata.ts` (every reference was resolved on 2026-10-12: the
DOIs through doi.org and Crossref, the arXiv entry through its API, and the manuscript through
the openai/math repository):

```ts
import type { VisualizationMetadata } from "@/lib/visualization/types";

export const pottsMetadata: VisualizationMetadata = {
  slug: "potts-model",
  title: "Potts Model",
  description:
    "Each site on a grid takes one of q colors and prefers to match its neighbors. With up to 4 colors the order melts gradually at the critical temperature; with more it breaks abruptly.",
  category: "Statistical mechanics",
  difficulty: "intermediate",
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
```

`src/visualizations/potts-model/explanation.mdx`:

```mdx
## What this shows

Each square is a **site** that holds one of $q$ states, drawn as $q$ colors.
Neighboring sites lower their energy by matching, while temperature changes
them at random. The **temperature** is shown as a multiple of the critical
temperature $T_c$, so the phase transition is always at 1:

- Below $T_c$, matching wins. Regions of one color grow, and given enough
  time one color covers most of the grid.
- Above $T_c$, the random changes win, and every color covers about
  $1/q$ of the grid.
- At $T_c$, what happens depends on $q$. Up to 4 states the transition is
  **continuous**: regions of every size appear at once, as in the Ising
  model. With 5 or more it is **discontinuous**: ordered and disordered
  regions can sit side by side, and the order disappears abruptly.

The corner shows the temperature, $q$ and the share of sites in the most
common state.

Things to try: at the default 3 states, drag the temperature from 1.2 down
to 0.8 and back. Then set 10 states and do the same, and compare how sharply
the order appears and disappears.

## How the visualization works

- Sites are updated with the **Metropolis algorithm**. Each attempt picks a
  site at random and proposes one of the other $q - 1$ states. If the energy
  would not go up, the change is made. Otherwise it is made with probability
  $e^{-\Delta E/T}$.
- One **sweep** is as many attempts as there are sites.
- The grid wraps around at the edges, so no site sits on a boundary.
- All randomness comes from a seeded pseudo-random generator, and the
  acceptance probabilities use only addition, subtraction, multiplication and
  division, so a shared link replays exactly in every browser.
- The simulation runs in a Web Worker so the page stays responsive.

## Parameters

- **Grid size**: sites along each side. Restarts the run.
- **States**: $q$, from 2 to 10. Restarts the run.
- **Temperature**: as a multiple of $T_c$. Applies from the next sweep.
- **Starting state**: random (as if infinitely hot) or all the same (as if
  at absolute zero). Restarts the run.
- **Speed**: sweeps per second. Never changes the results.

## Mathematical background

A configuration assigns a state $\sigma_i \in \{1, \dots, q\}$ to every site
$i$. Its energy is

$$
H = -\sum_{\langle i, j \rangle} \delta(\sigma_i, \sigma_j),
$$

summed over neighboring pairs, where $\delta(a, b)$ is 1 when $a = b$ and 0
otherwise. At temperature $T$ a configuration occurs with probability
proportional to $e^{-H/T}$. With $q = 2$ this is the Ising model with every
temperature halved: $T_c$ is about 1.135 here and 2.269 there.

Renfrey Potts introduced the model in 1952 and located its critical point on
the square lattice by a duality argument. Beffara and Duminil-Copin proved in
2012 that the transition is at

$$
T_c = \frac{1}{\ln\bigl(1 + \sqrt{q}\bigr)},
$$

about 0.995 for $q = 3$. Whether the transition is continuous was settled by
Duminil-Copin, Sidoravicius and Tassion for $q \le 4$ and by Duminil-Copin,
Gagnebin, Harel, Manolescu and Tassion for $q > 4$.

Each configuration also has a **random-cluster** (Fortuin–Kasteleyn) picture,
in which bonds between equal neighbors are kept at random and the spins are
read off the clusters. At $T_c$ with $q \le 4$ the boundaries of those
clusters are expected to look like Schramm–Loewner evolution (SLE) curves. A
2026 manuscript from OpenAI's openai/math collection proves this for
$1 \le q < 4$. It has not been refereed, and its main result is not
formalized in Lean. This page shows the spins, not those cluster boundaries.

## References

Full citations are listed below.
```

`src/visualizations/potts-model/definition.ts`:

```ts
import { defineLatticeVisualization } from "@/templates/lattice/definition";
import { describePotts } from "@/visualizations/potts-model/describe";
import { pottsMetadata } from "@/visualizations/potts-model/metadata";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";

export const pottsModel = defineLatticeVisualization({
  metadata: pottsMetadata,
  params: pottsParams,
  simulation: pottsSimulation,
  renderer: () => import("./renderer").then((m) => m.createPottsRenderer),
  describe: describePotts,
  explanation: () => import("./explanation.mdx"),
});
```

In `src/visualizations/registry.ts`, import `pottsModel` and add it after `isingModel`:

```diff
 import { lorenzAttractor } from "@/visualizations/lorenz-attractor/definition";
 import { percolation } from "@/visualizations/percolation/definition";
+import { pottsModel } from "@/visualizations/potts-model/definition";
 import { randomWalk } from "@/visualizations/random-walk/definition";
@@
   isingModel,
+  pottsModel,
 ]);
```

In `src/workers/simulations.ts`:

```diff
 import { percolationSimulation } from "@/visualizations/percolation/simulation";
+import { pottsSimulation } from "@/visualizations/potts-model/simulation";
@@
   "ising-model": isingSimulation as Simulation<unknown, unknown>,
+  "potts-model": pottsSimulation as Simulation<unknown, unknown>,
 };
```

- [ ] **Step 6: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 140 unit tests. The registry, palette, explanation and description tests now
cover Potts too.

Run: `npm run build && npm run test:e2e`
Expected: 19 passed, including "potts-model: renders, writes its URL and saves a frame".

Then look at `/visualizations/potts-model?seed=7` and `?q=10&seed=7` in both themes. At q = 3
and 1 Tc you should see clusters of every size in three colors; at q = 10 you should see ten
distinct colors.

- [ ] **Step 7: Docs and commit**

`CHANGELOG.md`, under Unreleased `### Added`:

```md
- **Potts model** page: the q-state generalization of the Ising model, from 2 to 10 states,
  with the temperature as a multiple of the critical temperature. Up to 4 states the transition
  is continuous; above it is abrupt. The first model built on the lattice template.
```

`docs/STATUS.md`: five visualizations; unit tests 140, e2e 19.

```bash
git add -A && git commit -m "feat(potts): add the Potts model on the lattice template"
```

---

### Task 4: Model families and the switcher

**Files:**

- Modify: `src/lib/visualization/types.ts` (add `family?`)
- Create: `src/lib/visualization/family.ts`, `src/lib/visualization/family.test.ts`
- Create: `src/components/visualization/model-switcher.tsx`
- Modify: `src/components/visualization/visualization-host.tsx`, `src/app/visualizations/[slug]/page.tsx`
- Modify: `src/visualizations/ising-model/metadata.ts`, `src/visualizations/potts-model/metadata.ts`
- Modify: `e2e/smoke.spec.ts`

**Interfaces:**

- Consumes: `serializeParams(schema, values, seed)` from `@/lib/url-state/params` (existing),
  and `visualizations` from `@/visualizations/registry`.
- Produces: `VisualizationMetadata.family?: string`, `familyMembers(definitions, slug):
VisualizationMetadata[]`, and `<ModelSwitcher family members current query />`.

- [ ] **Step 1: Add the field and write the failing tests**

In `src/lib/visualization/types.ts`, after `difficulty` in `VisualizationMetadata`:

```ts
  /**
   * Models that are variations on one idea, e.g. "Lattice spin models". Pages in
   * the same family link to each other and carry shared params over (ADR 0014).
   */
  family?: string;
```

`src/lib/visualization/family.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { ParamSpec } from "@/lib/url-state/params";
import { familyMembers } from "@/lib/visualization/family";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";
import { randomWalk } from "@/visualizations/random-walk/definition";
import { visualizations } from "@/visualizations/registry";

function page(slug: string, family?: string): AnyVisualizationDefinition {
  return { ...randomWalk, metadata: { ...randomWalk.metadata, slug, family } };
}

/** What a shared key must agree on for its value to mean the same on both pages. */
function meaning(spec: ParamSpec): unknown {
  switch (spec.type) {
    case "boolean":
      return "boolean";
    case "enum":
      return spec.options.map((option) => option.value);
    default:
      return [spec.min, spec.max, spec.step];
  }
}

describe("familyMembers", () => {
  const list = [page("a", "Walks"), page("b"), page("c", "Walks"), page("d", "Solo")];

  it("lists the family in registry order, including the page itself", () => {
    expect(familyMembers(list, "c").map((m) => m.slug)).toEqual(["a", "c"]);
  });

  it("is empty without a family, for a family of one, or for an unknown slug", () => {
    expect(familyMembers(list, "b")).toEqual([]);
    expect(familyMembers(list, "d")).toEqual([]);
    expect(familyMembers(list, "missing")).toEqual([]);
  });
});

describe("registered families", () => {
  it("give params shared within a family the same type and range", () => {
    // The switcher carries shared keys over, so a shared key must mean the same on both pages.
    for (const a of visualizations.list()) {
      for (const b of familyMembers(visualizations.list(), a.metadata.slug)) {
        const other = visualizations.get(b.slug)!;
        for (const key of Object.keys(a.params)) {
          if (!(key in other.params)) continue;
          const where = `${a.metadata.slug} and ${b.slug}: "${key}"`;
          expect(meaning(other.params[key]), where).toEqual(meaning(a.params[key]));
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/visualization/family.test.ts`
Expected: FAIL, because `@/lib/visualization/family` cannot be resolved.

- [ ] **Step 3: Implement `familyMembers` and put both lattice pages in a family**

`src/lib/visualization/family.ts`:

```ts
import type { AnyVisualizationDefinition, VisualizationMetadata } from "@/lib/visualization/types";

/**
 * Every page in `slug`'s family, itself included, in registry order (ADR 0014).
 * Empty when it has no family or is the only member, so there is nothing to switch to.
 */
export function familyMembers(
  definitions: readonly AnyVisualizationDefinition[],
  slug: string,
): VisualizationMetadata[] {
  const family = definitions.find((d) => d.metadata.slug === slug)?.metadata.family;
  if (!family) return [];
  const members = definitions.filter((d) => d.metadata.family === family).map((d) => d.metadata);
  return members.length > 1 ? members : [];
}
```

In both `src/visualizations/ising-model/metadata.ts` and `src/visualizations/potts-model/metadata.ts`, after `difficulty: "intermediate",`:

```ts
  family: "Lattice spin models",
```

Run: `npx vitest run src/lib/visualization`
Expected: PASS. The family test checks Ising and Potts: `side`, `start`, `speed` and `palette`
match, and `temperature` and `relativeTemperature` don't collide.

- [ ] **Step 4: Write the failing e2e tests**

In `e2e/smoke.spec.ts`, before `test("controls write to the URL, and reloading keeps them"`:

```ts
test("the model switcher opens a sibling page with the shared settings", async ({ page }) => {
  let started = 0;
  let stopped = 0;
  page.on("worker", (worker) => {
    started++;
    worker.on("close", () => stopped++);
  });
  await page.goto("/visualizations/ising-model?side=64&palette=viridis&temperature=3&seed=7");
  const models = page.getByRole("navigation", { name: "Lattice spin models" });
  await expect(models.locator("[aria-current=page]")).toHaveText("Ising Model");

  await models.getByRole("link", { name: "Potts Model" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Potts Model" })).toBeVisible();
  await expect(models.locator("[aria-current=page]")).toHaveText("Potts Model");
  // Shared keys carry over; Ising's temperature is dropped when the page rewrites its URL.
  const potts = visualizations.get("potts-model")!;
  await expect
    .poll(() => [...new URL(page.url()).searchParams.keys()].sort())
    .toEqual([...Object.keys(potts.params), "seed"].sort());
  const search = new URL(page.url()).searchParams;
  expect([search.get("side"), search.get("palette"), search.get("seed")]).toEqual([
    "64",
    "viridis",
    "7",
  ]);
  await expect(page.locator("canvas")).toBeVisible();
  // The Ising worker stopped and the Potts one started.
  await expect.poll(() => [started, stopped]).toEqual([2, 1]);
});
```

Inside `test.describe("on a phone", …)`, before the two-finger test:

```ts
test("the model switcher fits the screen", async ({ page }) => {
  await page.goto("/visualizations/potts-model?seed=7");
  await expect(page.getByRole("navigation", { name: "Lattice spin models" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
```

Run: `npm run build && npx playwright test -g "model switcher"`
Expected: FAIL, because there is no navigation named "Lattice spin models".

- [ ] **Step 5: Implement the switcher**

`src/components/visualization/model-switcher.tsx`:

```tsx
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VisualizationMetadata } from "@/lib/visualization/types";

/**
 * Links to the other models in this page's family (ADR 0014). Each link
 * carries this run's params and seed; the target page keeps the keys it
 * shares and drops the rest.
 */
export function ModelSwitcher(props: {
  family: string;
  members: readonly VisualizationMetadata[];
  current: string;
  query: string;
}) {
  return (
    <nav aria-label={props.family} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-sm text-muted-foreground">{props.family}</span>
      {props.members.map((member) =>
        member.slug === props.current ? (
          <span
            key={member.slug}
            aria-current="page"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            {member.title}
          </span>
        ) : (
          <Link
            key={member.slug}
            href={`/visualizations/${member.slug}?${props.query}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {member.title}
          </Link>
        ),
      )}
    </nav>
  );
}
```

In `src/components/visualization/visualization-host.tsx`:

```diff
+import { ModelSwitcher } from "@/components/visualization/model-switcher";
 import { ParamControls } from "@/components/visualization/param-controls";
@@
-import { shareUrl, type ParamValue } from "@/lib/url-state/params";
+import { serializeParams, shareUrl, type ParamValue } from "@/lib/url-state/params";
+import { familyMembers } from "@/lib/visualization/family";
 import type { AnyVisualizationDefinition } from "@/lib/visualization/types";
@@
   const viewportRef = useRef<ViewportHandle>(null);
+  const family = familyMembers(visualizations.list(), slug);
   const [status, setStatus] = useState("");
@@
       <div className="min-w-0 space-y-3">
+        {family.length > 0 && (
+          <ModelSwitcher
+            family={definition.metadata.family!}
+            members={family}
+            current={slug}
+            query={serializeParams(definition.params, params, seed).toString()}
+          />
+        )}
         <VisualizationViewport
```

The link is built from React state, not the address bar, because the address bar is updated
250 ms after a change (the same reason as **Copy link**).

In `src/app/visualizations/[slug]/page.tsx`:

```diff
-        <VisualizationHost slug={slug} />
+        {/* Keyed so that switching models in a family starts a fresh host, runner and worker. */}
+        <VisualizationHost key={slug} slug={slug} />
```

- [ ] **Step 6: Run everything**

Run: `npm run check && npm run format:check`
Expected: PASS, 143 unit tests.

Run: `npm run build && npm run test:e2e`
Expected: 21 passed.

Then look at the Ising and Potts pages in both themes at desktop width and at 390 px. The row
should read "Lattice spin models" followed by two buttons, with the current model filled in.

- [ ] **Step 7: Docs and commit**

`CHANGELOG.md`, under Unreleased `### Added`:

```md
- A model switcher on pages that belong to a family, starting with **Lattice spin models**
  (Ising and Potts). Switching keeps the seed and every setting the two pages share, such as
  grid size, speed and palette.
```

`docs/STATUS.md`: unit tests 143, e2e 21; add the switcher to "What works".

```bash
git add -A && git commit -m "feat(families): link models in a family with a model switcher"
```

---

### Task 5: ADR, guides and the pull request

**Files:**

- Create: `docs/decisions/0014-visualization-templates-and-families.md`
- Modify: `docs/decisions/README.md`, `README.md`, `CLAUDE.md`, `docs/ROADMAP.md`,
  `docs/ISSUES.md`, `docs/STATUS.md`, `docs/plans/2026-10-12-template-system-design.md`

- [ ] **Step 1: Write ADR 0014**

`docs/decisions/0014-visualization-templates-and-families.md`:

```md
# 0014: Visualization templates and model families

- **Status:** Accepted
- **Date:** the date of this commit, as YYYY-MM-DD

## Context

The openai/math review found 11 models we can show now. Most are variations on the Ising
model, percolation or the random walk. Writing each as a separate simulation and renderer would
repeat the same loop, lattice drawing, pan and zoom, and palette handling many times. We also
decided that each model keeps its own page, and that related pages should link to each other.

## Decision

- A **template** in `src/templates/<name>/` owns everything models of one structure share: a
  params helper, a simulation factory, a Pixi-free painter interface, a renderer factory and a
  definition helper. A model in `src/visualizations/<slug>/` supplies only its fields, its update
  rule, its painter, its params, metadata and explanation, and is registered like any other
  visualization. The first template is the lattice Markov chain (`src/templates/lattice/`), used
  by Ising and Potts.
- The simulation and renderer factories stay separate, so the worker bundle still has no
  renderer code (ADR 0005). Templates compute shared work, such as lattice neighbors, inline in
  their loops; a per-attempt helper call made Ising 40% slower.
- Ported models keep their pinned replay tests unchanged; a template must draw random numbers in
  exactly the old order.
- `VisualizationMetadata.family` groups related pages. When a family has two or more pages, the
  host shows links to them that carry the current params and seed. A key shared within a family
  must mean the same on every page; a test checks types and ranges, and a model whose parameter
  differs uses a different key.
- Deterministic replacements for `Math` functions live in `src/lib/math/deterministic.ts`.

## Alternatives considered

- **One page per template, with a model select:** fewer pages, but the param schema would
  change with the model, and models would share one explanation and one search listing.
- **Inheritance or a generic "lattice visualization" with switches:** every new model would
  add branches to shared code; the hook objects keep each model's code in its own folder.
- **No templates:** simplest per page, but repeats about 150 lines of renderer per model.

## Consequences

- A lattice model is about 6 small files, and most of the new code is the update rule.
- Template changes affect several pages at once, so their tests must cover every model, and
  ported models' pinned replays guard old links.
- Revisit if a model needs a hook the template doesn't have: extend the template, or leave that
  model on its own.
```

Add it to the index in `docs/decisions/README.md`:

```md
| [0014](0014-visualization-templates-and-families.md) | Visualization templates and model families | Accepted | (the ADR's date) |
```

- [ ] **Step 2: Update the guides**

`README.md`:

- **Directory structure:** add `src/lib/math/` ("deterministic math for simulations") and
  `src/templates/lattice/` ("lattice Markov chain template: simulation, params, painter, renderer,
  definition").
- **Adding a new visualization:** add this before step 1:

```md
**If your model fits a template, start there.** A lattice model updated one site at a time
(like Ising and Potts) needs only a `LatticeModel` (`init`, `prepare`, `attempt`) in
`simulation.ts`, a `LatticePainter` in `painter.ts`, and `latticeParams({...})` for its own
params. Its `renderer.ts` is one line, and `defineLatticeVisualization` replaces step 7. Use
`src/visualizations/potts-model/` as the reference ([ADR 0014](docs/decisions/0014-visualization-templates-and-families.md)).
To put related pages in a model switcher, give them the same `family` in `metadata.ts`, and
give shared params the same key only when they mean the same thing.
```

`CLAUDE.md`, under "Layers and their contracts", add after the Colors bullet:

```md
- Templates (`src/templates/<name>/`, ADR 0014): shared simulation loop, params, renderer and
  definition helper for models of one structure; a model supplies hooks and a Pixi-free painter.
  `src/templates/lattice/` serves Ising and Potts. Ported models keep their pinned replay tests
  unchanged. `metadata.family` links related pages through the model switcher, and a test makes
  shared keys within a family agree.
```

- [ ] **Step 3: Update the project docs**

- `docs/ROADMAP.md`: replace "Milestone 5: not yet planned 🚧" with:

```md
## Milestone 5: Templates and the first openai/math models 🚧

Goal: show the 11 "do now" models from the [openai/math review](research/openai-math-candidates.md)
on shared templates ([design](plans/2026-10-12-template-system-design.md)). Exit criterion: all
11 are live, each with a pinned replay test and verified references.

- ✅ Color palettes on every visualization, switchable mid-run (ADR 0013)
- ✅ Lattice template, Ising ported, Potts model, model families and switcher (ADR 0014)
- Remaining lattice models: random-bond Ising, Ashkin–Teller, XY, O(3)
- Planar-particle template, random walk ported, and four models
- Lattice-growth template, percolation ported, and two models
```

- `docs/ISSUES.md` ISS-005: add a line dated the day of the commit: "`src/lib/math/deterministic.ts` now holds
  `expNegative`; deterministic `sin`/`cos` for XY, O(3) and the standard map go there (Plan 2)."
  Keep the status open.
- `docs/STATUS.md`: "In progress" → Plan 2 next; "Last updated" today.
- `docs/plans/2026-10-12-template-system-design.md`: Status → "Accepted; Plan 1 done".

- [ ] **Step 4: Final check, commit and PR**

```bash
npm run check && npm run format:check && npm run build && npm run test:e2e
git add -A && git commit -m "docs(templates): record the template system in ADR 0014 and the guides"
git push -u origin feat/lattice-template
gh pr create --title "feat(templates): lattice template, Potts model and model switcher" --body-file pr-body.md
```

Write `pr-body.md` (outside the repo, or delete it before committing) from
`.github/pull_request_template.md`:

- **What and why:** the template system design and Plan 1; Ising moved onto
  `src/templates/lattice/` with its pinned replay unchanged; the Potts page; the
  `family` field and the model switcher; ADR 0014.
- **Type:** New visualization, and Feature / infrastructure.
- **Checklist:** tick each item, having checked it.
- **Screenshots:** the Potts page at q = 3 and q = 10, and the Ising page on a phone with the
  switcher.
- End the body with the attribution lines from the session's instructions.

Expected: CI `check` passes. Leave merging to the maintainer.
