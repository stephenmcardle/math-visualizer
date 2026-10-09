import { createRng, nextFloat } from "@/lib/random/prng";
import type { Simulation } from "@/lib/simulation/types";
import type { LorenzParams } from "@/visualizations/lorenz-attractor/params";

/** Lorenz's classic values; only ρ is a user parameter. */
export const SIGMA = 10;
export const BETA = 8 / 3;
/** Fixed time step of one simulation step. */
export const DT = 0.005;
/** Where the reference point starts before it is integrated onto the attractor. */
export const ORIGIN_POINT: readonly [number, number, number] = [1, 1, 1];
/**
 * Steps (model time 20) to carry the reference point onto the ρ = 28 attractor
 * before placing the starting cube around it. Starting near the origin instead
 * keeps the bundle squeezed together for a long time before it spreads. The
 * warmup always uses ρ = 28, so for other ρ the run shows the motion away from
 * that classic attractor (e.g. spiraling into a fixed point) instead of
 * starting where it has already settled.
 */
export const WARMUP_STEPS = 4000;
const WARMUP_RHO = 28;

/**
 * Many trajectories of the Lorenz system
 *
 *   x' = σ(y − x),  y' = x(ρ − z) − y,  z' = xy − βz,
 *
 * advanced with classic fourth-order Runge–Kutta at a fixed step `DT`.
 *
 * The integrator uses only +, −, × and ÷. JavaScript requires each of these to
 * be correctly rounded IEEE 754 double arithmetic (no fused multiply-add), so a
 * run is bit-for-bit identical in every engine, which matters for a chaotic
 * system where any difference grows exponentially. Keep transcendental
 * functions (Math.sin, Math.exp, ...) out of this file.
 */
export interface LorenzState {
  /** Steps taken since creation; model time is `step * DT`. */
  step: number;
  rho: number;
  x: Float64Array;
  y: Float64Array;
  z: Float64Array;
}

/** The center of the starting cube: `ORIGIN_POINT` after `WARMUP_STEPS` steps at ρ = 28. */
export function startingCenter(): [number, number, number] {
  const point: LorenzState = {
    step: 0,
    rho: WARMUP_RHO,
    x: Float64Array.of(ORIGIN_POINT[0]),
    y: Float64Array.of(ORIGIN_POINT[1]),
    z: Float64Array.of(ORIGIN_POINT[2]),
  };
  for (let i = 0; i < WARMUP_STEPS; i++) advance(point);
  return [point.x[0], point.y[0], point.z[0]];
}

/** One RK4 step of every trajectory. */
function advance(state: LorenzState): void {
  const { x, y, z, rho } = state;
  const h = DT;
  const half = DT / 2;
  for (let i = 0; i < x.length; i++) {
    const x0 = x[i];
    const y0 = y[i];
    const z0 = z[i];

    const ax = SIGMA * (y0 - x0);
    const ay = x0 * (rho - z0) - y0;
    const az = x0 * y0 - BETA * z0;

    const x1 = x0 + half * ax;
    const y1 = y0 + half * ay;
    const z1 = z0 + half * az;
    const bx = SIGMA * (y1 - x1);
    const by = x1 * (rho - z1) - y1;
    const bz = x1 * y1 - BETA * z1;

    const x2 = x0 + half * bx;
    const y2 = y0 + half * by;
    const z2 = z0 + half * bz;
    const cx = SIGMA * (y2 - x2);
    const cy = x2 * (rho - z2) - y2;
    const cz = x2 * y2 - BETA * z2;

    const x3 = x0 + h * cx;
    const y3 = y0 + h * cy;
    const z3 = z0 + h * cz;
    const dx = SIGMA * (y3 - x3);
    const dy = x3 * (rho - z3) - y3;
    const dz = x3 * y3 - BETA * z3;

    x[i] = x0 + (h / 6) * (ax + 2 * bx + 2 * cx + dx);
    y[i] = y0 + (h / 6) * (ay + 2 * by + 2 * cy + dy);
    z[i] = z0 + (h / 6) * (az + 2 * bz + 2 * cz + dz);
  }
  state.step++;
}

export const lorenzSimulation: Simulation<LorenzParams, LorenzState> = {
  create(params, seed) {
    const rng = createRng(seed);
    const [cx, cy, cz] = startingCenter();
    const n = params.trajectories;
    const x = new Float64Array(n);
    const y = new Float64Array(n);
    const z = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = cx + (nextFloat(rng) - 0.5) * params.spread;
      y[i] = cy + (nextFloat(rng) - 0.5) * params.spread;
      z[i] = cz + (nextFloat(rng) - 0.5) * params.spread;
    }
    return { step: 0, rho: params.rho, x, y, z };
  },

  step: advance,
};
