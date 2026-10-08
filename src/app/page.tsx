import Link from "next/link";

import { VisualizationCard } from "@/components/visualization/visualization-card";
import { GITHUB_URL, SITE_NAME } from "@/lib/site";
import { visualizations } from "@/visualizations/registry";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16">
      <section className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{SITE_NAME}</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Interactive visualizations of mathematical systems: stochastic processes, algorithms,
          graph structures, dynamical systems and more. Every run is seeded, so a link reproduces
          exactly what you saw.
        </p>
        <p className="leading-7 text-muted-foreground">
          The project is open source under the Apache License 2.0 and built to make adding a new
          visualization straightforward.{" "}
          <a href={GITHUB_URL} className="font-medium text-foreground underline underline-offset-4">
            View the source on GitHub
          </a>{" "}
          or{" "}
          <Link href="/about" className="font-medium text-foreground underline underline-offset-4">
            read how it works
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="visualizations-heading" className="mt-12">
        <h2 id="visualizations-heading" className="mb-4 text-xl font-semibold tracking-tight">
          Visualizations
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visualizations.list().map((definition) => (
            <li key={definition.metadata.slug} className="flex">
              <VisualizationCard definition={definition} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
