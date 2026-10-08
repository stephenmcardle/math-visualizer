# 0005: Simulation runners and opt-in Web Workers

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Some future simulations will be too CPU-heavy for the main thread. Moving one into a worker
should not require rewriting it or its renderer. The first visualization does not need a worker.

## Decision

- The viewport talks to a `SimulationRunner` (`reset`, `advance`, `current`, `dispose`).
  `LocalSimulationRunner` runs on the main thread; `WorkerSimulationRunner` runs the same
  `Simulation` in a dedicated worker.
- A definition opts in with `execution: "worker"` and must register its simulation in
  `src/workers/simulations.ts`. That map is separate from the main registry so the worker bundle
  never pulls in renderers or MDX; a test enforces the registration.
- The protocol (`worker-protocol.ts`) is a pure handler function, tested without a real worker.
  Each reset bumps a generation number, and stale replies are dropped. At most one request is in
  flight; steps requested meanwhile are batched.
- Snapshots use structured clone for now.
- The worker is created as `new Worker(new URL("../../workers/simulation.worker.ts", import.meta.url))`
  **without** `{ type: "module" }`. With that option, Turbopack 16.4 copied the raw `.ts` file as
  a static asset instead of bundling it (found during the scaffold build).

## Alternatives considered

- **Comlink or similar RPC library:** convenient, but another dependency, and hides the
  batching/back-pressure behavior we want to control.
- **One worker module per visualization:** more isolation, more boilerplate per contributor.
- **Transferable buffers from day one:** premature for the random walk.

## Consequences

- Moving a simulation into a worker is a two-line change, and determinism is unchanged (tested).
- Snapshots lag the main thread by up to a frame in worker mode.
- Worker crashes are logged but not recovered (ISSUES ISS-008).
- Re-check the `type: "module"` behavior when upgrading Next.js (ISSUES ISS-001).
