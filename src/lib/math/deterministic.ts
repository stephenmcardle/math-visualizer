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
