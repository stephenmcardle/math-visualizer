import { describe, expect, it } from "vitest";

import { createRng } from "@/lib/random/prng";
import { defaultParams } from "@/lib/url-state/params";
import { describeAshkinTeller } from "@/visualizations/ashkin-teller/describe";
import { ashkinTellerParams } from "@/visualizations/ashkin-teller/params";
import { ashkinTellerSimulation } from "@/visualizations/ashkin-teller/simulation";
import { describeIsing } from "@/visualizations/ising-model/describe";
import { isingParams } from "@/visualizations/ising-model/params";
import { isingSimulation } from "@/visualizations/ising-model/simulation";
import { describeLorenz } from "@/visualizations/lorenz-attractor/describe";
import { describeO3 } from "@/visualizations/o3-model/describe";
import { o3Params } from "@/visualizations/o3-model/params";
import { o3Simulation } from "@/visualizations/o3-model/simulation";
import { describePercolation } from "@/visualizations/percolation/describe";
import { percolationParams } from "@/visualizations/percolation/params";
import { percolationSimulation } from "@/visualizations/percolation/simulation";
import { describePotts } from "@/visualizations/potts-model/describe";
import { pottsParams } from "@/visualizations/potts-model/params";
import { pottsSimulation } from "@/visualizations/potts-model/simulation";
import { describeRandomBondIsing } from "@/visualizations/random-bond-ising/describe";
import { randomBondIsingParams } from "@/visualizations/random-bond-ising/params";
import { randomBondIsingSimulation } from "@/visualizations/random-bond-ising/simulation";
import { describeRandomWalk } from "@/visualizations/random-walk/describe";
import { randomWalkParams } from "@/visualizations/random-walk/params";
import { visualizations } from "@/visualizations/registry";
import { describeXy } from "@/visualizations/xy-model/describe";
import { xyParams } from "@/visualizations/xy-model/params";
import { xySimulation } from "@/visualizations/xy-model/simulation";

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

  it("Potts: reports q, the relative temperature and the largest state's share", () => {
    const params = { ...defaultParams(pottsParams), side: 16, start: "up" };
    expect(describePotts(pottsSimulation.create(params, 3), params)).toBe(
      "16 by 16 sites with 3 states at 1.00 times the critical temperature, after 0 sweeps. " +
        "The most common state covers 100% of sites.",
    );
  });

  it("random-bond Ising: reports the disorder, temperature and share of up spins", () => {
    const params = { ...defaultParams(randomBondIsingParams), side: 16, start: "up" };
    expect(describeRandomBondIsing(randomBondIsingSimulation.create(params, 3), params)).toBe(
      "16 by 16 spins with bond disorder 0.30, at 1.00 times the critical temperature, " +
        "after 0 sweeps. 100% of spins point up.",
    );
  });

  it("Ashkin–Teller: reports both layers and how often they agree", () => {
    const params = { ...defaultParams(ashkinTellerParams), side: 16, start: "up" };
    expect(describeAshkinTeller(ashkinTellerSimulation.create(params, 3), params)).toBe(
      "16 by 16 sites with four-spin coupling 0.50, at 1.00 times the critical temperature, " +
        "after 0 sweeps. 100% of σ spins and 100% of τ spins point up, and the two agree " +
        "at 100% of sites.",
    );
  });

  it("XY: reports the temperature and the vortex counts", () => {
    const params = { ...defaultParams(xyParams), side: 16, start: "up" };
    expect(describeXy(xySimulation.create(params, 3), params)).toBe(
      "16 by 16 spins at temperature 0.89, after 0 sweeps: 0 vortices and 0 antivortices.",
    );
  });

  it("O(3): reports the temperature and the length of the average spin", () => {
    const params = { ...defaultParams(o3Params), side: 16, start: "up" };
    expect(describeO3(o3Simulation.create(params, 3), params)).toBe(
      "16 by 16 spins at temperature 1.00, after 0 sweeps. The average spin has length 1.000.",
    );
  });
});
