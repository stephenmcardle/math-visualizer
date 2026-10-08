import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { VisualizationHost } from "@/components/visualization/visualization-host";
import { visualizations } from "@/visualizations/registry";

// Static export: every visualization page is generated at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return visualizations.list().map((definition) => ({ slug: definition.metadata.slug }));
}

export async function generateMetadata(
  props: PageProps<"/visualizations/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const definition = visualizations.get(slug);
  if (!definition) return {};
  return { title: definition.metadata.title, description: definition.metadata.description };
}

function ViewportFallback() {
  return (
    <div className="h-[60svh] min-h-72 animate-pulse rounded-xl border bg-muted motion-reduce:animate-none lg:h-[min(72svh,760px)]" />
  );
}

export default async function VisualizationPage(props: PageProps<"/visualizations/[slug]">) {
  const { slug } = await props.params;
  const definition = visualizations.get(slug);
  if (!definition) notFound();

  const { metadata } = definition;
  const Explanation = definition.explanation ? (await definition.explanation()).default : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
      <header className="mb-6 max-w-3xl space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{metadata.category}</Badge>
          <Badge variant="outline">{metadata.difficulty}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{metadata.title}</h1>
        <p className="leading-7 text-muted-foreground">{metadata.description}</p>
      </header>

      {/* The host reads the query string, which is only known in the browser. */}
      <Suspense fallback={<ViewportFallback />}>
        <VisualizationHost slug={slug} />
      </Suspense>

      {(Explanation || metadata.references.length > 0) && (
        <article className="mt-12 max-w-3xl">
          {Explanation && <Explanation />}
          {metadata.references.length > 0 && (
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-6">
              {metadata.references.map((reference) => (
                <li key={`${reference.title}-${reference.authors}`}>
                  {reference.authors && <span>{reference.authors}. </span>}
                  {reference.url ? (
                    <a href={reference.url} className="underline underline-offset-4">
                      {reference.title}
                    </a>
                  ) : (
                    reference.title
                  )}
                  {reference.year && <span> ({reference.year})</span>}
                  {reference.note && (
                    <span className="text-muted-foreground">. {reference.note}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </article>
      )}
    </div>
  );
}
