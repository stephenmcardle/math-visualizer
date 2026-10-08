import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";

export function VisualizationCard({ definition }: { definition: AnyVisualizationDefinition }) {
  const { metadata, renderer } = definition;
  return (
    <Link
      href={`/visualizations/${metadata.slug}`}
      className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{metadata.category}</Badge>
        <Badge variant="outline">{metadata.difficulty}</Badge>
        <Badge variant="outline">{renderer.engine === "pixi" ? "2D" : "3D"}</Badge>
      </div>
      <h3 className="text-lg font-semibold tracking-tight group-hover:underline group-hover:underline-offset-4">
        {metadata.title}
      </h3>
      <p className="text-sm leading-6 text-muted-foreground">{metadata.description}</p>
    </Link>
  );
}
