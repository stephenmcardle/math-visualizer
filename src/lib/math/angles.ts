import { cosTurns, sinTurns } from "@/lib/math/deterministic";

/**
 * Angles as whole steps of 1/65536 turn, stored in a Uint16Array. Arithmetic
 * on steps is exact and wraps with a mask, and cos and sin become lookups in
 * tables built once with deterministic math (ISS-005). 65536 directions are
 * far finer than anything a lattice simulation can resolve.
 */
export const ANGLE_STEPS = 65536;
export const ANGLE_MASK = ANGLE_STEPS - 1;

export interface AngleTables {
  /** cos and sin of each step. */
  cos: Float64Array;
  sin: Float64Array;
}

let tables: AngleTables | null = null;

/**
 * The tables, built on first use rather than at import: every page imports the
 * registry, and building them costs tens of milliseconds that only XY and O(3) need.
 */
export function angleTables(): AngleTables {
  if (!tables) {
    const cos = new Float64Array(ANGLE_STEPS);
    const sin = new Float64Array(ANGLE_STEPS);
    for (let i = 0; i < ANGLE_STEPS; i++) {
      cos[i] = cosTurns(i / ANGLE_STEPS);
      sin[i] = sinTurns(i / ANGLE_STEPS);
    }
    tables = { cos, sin };
  }
  return tables;
}

/** b − a in steps, wrapped to the shorter way round: −32768 to 32767. */
export function angleDifference(a: number, b: number): number {
  return ((b - a + ANGLE_STEPS / 2) & ANGLE_MASK) - ANGLE_STEPS / 2;
}
