import type { Metadata } from "next";

import { GITHUB_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Goals and architecture of the project.",
};

const LAYERS = [
  {
    name: "Simulation",
    body: "Pure TypeScript state and math, with no React, DOM or rendering engine imports. Each simulation advances in fixed steps and draws randomness from a seeded generator, so the same seed and parameters always produce the same run.",
  },
  {
    name: "Renderer",
    body: "PixiJS for 2D (the default) or Three.js for genuinely 3D visualizations. A renderer reads simulation state and draws it; it never changes the simulation.",
  },
  {
    name: "UI",
    body: "React and shadcn/ui controls for parameters, seed, playback and render quality. React holds configuration only; the animation loop runs outside React so frames never trigger React renders.",
  },
  {
    name: "Worker",
    body: "Simulations exchange plain data, so a CPU-heavy one can move into a Web Worker by changing one field in its definition. The random-walk demo runs on the main thread.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
        <p>
          This project collects interactive visualizations of mathematical systems: stochastic
          processes, algorithms, graph structures, dynamical systems and other ideas from modern
          mathematics. Each one should be interactive, reproducible from a seed, shareable by URL,
          and fast enough to use on a phone.
        </p>
        <p>
          It is an independent open-source project. It runs entirely in the browser as a static
          site, with no accounts, database or backend.
        </p>
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Architecture</h2>
      <p className="mt-3 leading-7 text-muted-foreground">
        Each visualization is a self-contained module registered with a generic host page. Four
        layers are kept separate:
      </p>
      <dl className="mt-6 space-y-5">
        {LAYERS.map((layer) => (
          <div key={layer.name} className="rounded-xl border p-4">
            <dt className="font-semibold">{layer.name}</dt>
            <dd className="mt-1 leading-7 text-muted-foreground">{layer.body}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Contributing</h2>
      <p className="mt-3 leading-7 text-muted-foreground">
        New visualizations are welcome. The contributing guide in the{" "}
        <a href={GITHUB_URL} className="font-medium text-foreground underline underline-offset-4">
          repository
        </a>{" "}
        walks through adding one. Visualizations based on papers or external code must cite their
        sources and respect their licenses.
      </p>
    </div>
  );
}
