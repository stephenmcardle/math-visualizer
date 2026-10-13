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
