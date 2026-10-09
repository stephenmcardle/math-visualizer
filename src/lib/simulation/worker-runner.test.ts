import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkerRequest, WorkerResponse } from "@/lib/simulation/worker-protocol";
import { WorkerSimulationRunner } from "@/lib/simulation/worker-runner";

/** Records requests; tests play the worker's side by calling `reply` / `crash`. */
class FakeWorker {
  static last: FakeWorker;
  posted: WorkerRequest[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;

  constructor() {
    FakeWorker.last = this;
  }
  postMessage(request: WorkerRequest) {
    this.posted.push(request);
  }
  terminate() {
    this.terminated = true;
  }
  reply(response: WorkerResponse) {
    this.onmessage?.({ data: response } as MessageEvent<WorkerResponse>);
  }
  crash(message: string) {
    this.onerror?.({ message, preventDefault() {} } as ErrorEvent);
  }
}

function setup() {
  const onSnapshot = vi.fn();
  const onError = vi.fn();
  const runner = new WorkerSimulationRunner<{ n: number }, string>("test", onSnapshot, onError);
  return { runner, worker: FakeWorker.last, onSnapshot, onError };
}

beforeEach(() => {
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WorkerSimulationRunner", () => {
  it("keeps one request in flight and batches steps requested meanwhile", () => {
    const { runner, worker, onSnapshot } = setup();
    runner.reset({ n: 1 }, 42);
    runner.advance({ n: 1 }, 3);
    runner.advance({ n: 2 }, 4);
    expect(worker.posted.map((r) => r.type)).toEqual(["reset"]);

    worker.reply({ type: "snapshot", state: "s0", generation: 1 });
    expect(runner.current()).toEqual({ state: "s0", generation: 1 });
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(worker.posted[1]).toEqual({
      type: "advance",
      params: { n: 2 },
      steps: 7,
      generation: 1,
    });
  });

  it("ignores replies from before the latest reset", () => {
    const { runner, worker } = setup();
    runner.reset({ n: 1 }, 1);
    runner.reset({ n: 1 }, 2);
    worker.reply({ type: "snapshot", state: "old", generation: 1 });
    expect(runner.current()).toBeNull();
    worker.reply({ type: "snapshot", state: "new", generation: 2 });
    expect(runner.current()?.state).toBe("new");
  });

  it("stops and reports once when the simulation throws", () => {
    const { runner, worker, onError } = setup();
    runner.reset({ n: 1 }, 1);
    worker.reply({ type: "error", message: "boom" });

    expect(onError).toHaveBeenCalledWith("boom");
    expect(worker.terminated).toBe(true);
    runner.advance({ n: 1 }, 5);
    runner.reset({ n: 1 }, 2);
    worker.reply({ type: "error", message: "again" });
    expect(worker.posted).toHaveLength(1);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("stops and reports when the worker itself fails", () => {
    const { runner, worker, onError } = setup();
    runner.reset({ n: 1 }, 1);
    worker.crash("script error");
    expect(onError).toHaveBeenCalledWith("script error");
    expect(worker.terminated).toBe(true);
    runner.advance({ n: 1 }, 1);
    expect(worker.posted).toHaveLength(1);
  });
});
