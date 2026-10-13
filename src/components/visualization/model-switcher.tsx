import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VisualizationMetadata } from "@/lib/visualization/types";

/**
 * Links to the other models in this page's family (ADR 0014). Each link
 * carries this run's params and seed; the target page keeps the keys it
 * shares and drops the rest.
 */
export function ModelSwitcher(props: {
  family: string;
  members: readonly VisualizationMetadata[];
  current: string;
  query: string;
}) {
  return (
    <nav aria-label={props.family} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-sm text-muted-foreground">{props.family}</span>
      {props.members.map((member) =>
        member.slug === props.current ? (
          <span
            key={member.slug}
            aria-current="page"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            {member.title}
          </span>
        ) : (
          <Link
            key={member.slug}
            href={`/visualizations/${member.slug}?${props.query}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {member.title}
          </Link>
        ),
      )}
    </nav>
  );
}
