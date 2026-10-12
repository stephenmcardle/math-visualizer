import type { PercolationState } from "@/visualizations/percolation/simulation";

export function describePercolation(state: PercolationState): string {
  const sites = state.side * state.side;
  let largest = 0;
  for (let site = 0; site < sites; site++) {
    // A cluster's size is stored at its id, which is one of its own sites.
    if (state.label[site] === site) largest = Math.max(largest, state.size[site]);
  }
  const p = (state.opened / sites).toFixed(4);
  const spanning =
    state.spanningAt === -1
      ? "No cluster connects the top row to the bottom row yet."
      : `A cluster first connected top to bottom at p = ${(state.spanningAt / sites).toFixed(4)}.`;
  return (
    `${state.side} by ${state.side} grid, p = ${p}: ${state.opened} of ${sites} sites open. ` +
    `The largest cluster has ${largest} sites. ${spanning}`
  );
}
