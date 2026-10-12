import { describe, expect, it } from "vitest";

import { createRng } from "@/lib/random/prng";
import { defaultParams } from "@/lib/url-state/params";
import { describeIsing } from "@/visualizations/ising-model/describe";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
import { describeLorenz } from "@/visualizations/lorenz-attractor/describe";
import { describePercolation } from "@/visualizations/percolation/describe";
import { percolationParams } from "@/visualizations/percolation/params";
import { percolationSimulation } from "@/visualizations/percolation/simulation";
import { describeRandomWalk } from "@/visualizations/random-walk/describe";
import { randomWalkParams } from "@/visualizations/random-walk/params";
import { visualizations } from "@/visualizations/registry";

describe("screen-reader descriptions", () => {
  it("exist for every visualization", () => {
    for (const definition of visualizations.list()) expect(definition.describe).toBeDefined();
  });

  it("random walk: reports the RMS distance next to s·√n", () => {
    const state = {
      step: 4,
      rng: createRng(1),
      x: Float64Array.of(3, -3),
      y: Float64Array.of(4, 4),
    };
    const params = { ...defaultParams(randomWalkParams), stepSize: 2 };
    expect(describeRandomWalk(state, params)).toBe(
      "2 walkers after 4 steps. Root-mean-square distance from the start: 5.0 pixels; " +
        "step size times the square root of the step count gives 4.0.",
    );
  });

  it("percolation: reports p, the largest cluster and spanning", () => {
    const params = { ...defaultParams(percolationParams), side: 16 };
    const state = percolationSimulation.create(params, 3);
    expect(describePercolation(state)).toBe(
      "16 by 16 grid, p = 0.0000: 0 of 256 sites open. The largest cluster has 0 sites. " +
        "No cluster connects the top row to the bottom row yet.",
    );
    while (state.opened < 256) percolationSimulation.step(state, params);
    expect(describePercolation(state)).toContain("The largest cluster has 256 sites.");
    expect(describePercolation(state)).toContain(
      `first connected top to bottom at p = ${(state.spanningAt / 256).toFixed(4)}`,
    );
  });

  it("Lorenz: reports time, rho and the split between the wings", () => {
    const state = {
      step: 200,
      rho: 28,
      x: Float64Array.of(-5, 2, 7.25),
      y: new Float64Array(3),
      z: new Float64Array(3),
    };
    expect(describeLorenz(state)).toBe(
      "3 trajectories at time 1.0, rho = 28. x ranges from -5.0 to 7.3; " +
        "2 on the positive-x side and 1 on the negative-x side.",
    );
  });

  it("Ising: reports magnetization and the share of up spins", () => {
    const params = { ...defaultParams(isingParams), side: 32, start: "up" };
    const state = isingSimulation.create(params, 1);
    expect(describeIsing(state, params)).toBe(
      "32 by 32 spins at temperature 2.27, after 0 sweeps. " +
        "Magnetization per spin 1.000: 100% of spins point up.",
    );
  });
});
