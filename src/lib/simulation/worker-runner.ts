import type { SimulationRunner, Snapshot } from "@/lib/simulation/runner";
import type { WorkerRequest, WorkerResponse } from "@/lib/simulation/worker-protocol";

/**
 * Runs a simulation in a dedicated Web Worker. At most one request is in
 * flight; steps requested meanwhile are batched into the next request, so a
 * slow simulation drops frames instead of building an unbounded queue.
 *
 * Any worker failure is terminal: the worker is stopped, no further requests
 * are sent, and `onError` is called once so the page can say so instead of
 * freezing silently.
 */
export class WorkerSimulationRunner<TParams, TState> implements SimulationRunner<TParams, TState> {
  private readonly worker: Worker;
  private snapshot: Snapshot<TState> | null = null;
  private generation = 0;
  private inFlight = false;
  private pendingSteps = 0;
  private pendingParams: TParams | null = null;
  private failed = false;

  constructor(
    private readonly slug: string,
    /** Called whenever a new snapshot arrives, e.g. to schedule a redraw. */
    private readonly onSnapshot: () => void,
    /** Called once if the worker fails; the runner does nothing afterwards. */
    private readonly onError: (message: string) => void,
  ) {
    // Keep this exact `new Worker(new URL(...))` shape: Turbopack bundles it as
    // a worker entry. Adding `{ type: "module" }` made Turbopack 16.4 copy the
    // raw .ts file as a static asset instead.
    this.worker = new Worker(new URL("../../workers/simulation.worker.ts", import.meta.url));
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.receive(event.data);
    this.worker.onerror = (event) => {
      // Keep the browser from also reporting it as an uncaught error; `fail` logs it.
      event.preventDefault();
      this.fail(event.message || "The simulation worker could not start.");
    };
    this.worker.onmessageerror = () =>
      this.fail("A message from the simulation worker could not be read.");
  }

  reset(params: TParams, seed: number): void {
    if (this.failed) return;
    this.generation++;
    this.pendingSteps = 0;
    this.inFlight = true;
    this.post({ type: "reset", slug: this.slug, params, seed, generation: this.generation });
  }

  advance(params: TParams, steps: number): void {
    this.pendingSteps += steps;
    this.pendingParams = params;
    this.flush();
  }

  current(): Snapshot<TState> | null {
    return this.snapshot;
  }

  dispose(): void {
    this.worker.terminate();
    this.snapshot = null;
  }

  private flush(): void {
    if (this.failed || this.inFlight) return;
    if (this.pendingSteps === 0 || this.pendingParams === null) return;
    this.inFlight = true;
    this.post({
      type: "advance",
      params: this.pendingParams,
      steps: this.pendingSteps,
      generation: this.generation,
    });
    this.pendingSteps = 0;
  }

  private post(request: WorkerRequest): void {
    this.worker.postMessage(request);
  }

  private receive(response: WorkerResponse): void {
    if (this.failed) return;
    if (response.type === "error") {
      this.fail(response.message);
      return;
    }
    // A reply to a request sent before the latest reset; the reset's reply is still coming.
    if (response.generation !== this.generation) return;
    this.snapshot = { state: response.state as TState, generation: response.generation };
    this.inFlight = false;
    this.onSnapshot();
    this.flush();
  }

  private fail(message: string): void {
    if (this.failed) return;
    this.failed = true;
    this.inFlight = false;
    this.worker.terminate();
    console.error(`Simulation worker for "${this.slug}" failed:`, message);
    this.onError(message);
  }
}
