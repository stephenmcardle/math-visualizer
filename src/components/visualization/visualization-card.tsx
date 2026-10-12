import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { VisualizationMetadata } from "@/lib/visualization/types";

/** What a card shows. Plain data, so the client-side filter can render cards without the registry. */
export interface VisualizationSummary {
  metadata: VisualizationMetadata;
  engine: "pixi" | "three";
}

export function VisualizationCard({ metadata, engine }: VisualizationSummary) {
  return (
    <Link
      href={`/visualizations/${metadata.slug}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{metadata.category}</Badge>
        <Badge variant="outline">{metadata.difficulty}</Badge>
        <Badge variant="outline">{engine === "pixi" ? "2D" : "3D"}</Badge>
      </div>
      <h3 className="text-lg font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">
        {metadata.title}
      </h3>
      <p className="text-sm leading-6 text-muted-foreground">{metadata.description}</p>
    </Link>
  );
}

export function VisualizationGrid({ items }: { items: readonly VisualizationSummary[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.metadata.slug} className="flex">
          <VisualizationCard {...item} />
        </li>
      ))}
    </ul>
  );
}
