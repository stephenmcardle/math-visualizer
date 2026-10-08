import { createWorkerHandler, type WorkerRequest } from "@/lib/simulation/worker-protocol";
import { workerSimulations } from "@/workers/simulations";

const handle = createWorkerHandler((slug) => workerSimulations[slug]);

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const response = handle(event.data);
    if (response) self.postMessage(response);
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
