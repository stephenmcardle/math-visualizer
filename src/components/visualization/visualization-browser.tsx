"use client";

import { XIcon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  VisualizationGrid,
  type VisualizationSummary,
} from "@/components/visualization/visualization-card";
import {
  filterOptions,
  matchesFilters,
  NO_FILTERS,
  parseFilters,
  serializeFilters,
  type VisualizationFilters,
} from "@/lib/visualization/filter";

/** Select value for "no filter"; not a valid category, difficulty or tag. */
const ANY = "__any__";

function FilterSelect({
  label,
  anyLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  anyLabel: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string | null) => void;
}) {
  const labelId = useId();
  return (
    <div className="space-y-2">
      <Label id={labelId}>{label}</Label>
      <Select
        value={value ?? ANY}
        onValueChange={(next) => onChange(next === ANY || !next ? null : (next as string))}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue>{(current: string) => (current === ANY ? anyLabel : current)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function BrowserView({
  items,
  filters,
  onChange,
  disabled = false,
}: {
  items: readonly VisualizationSummary[];
  filters: VisualizationFilters;
  onChange: (filters: VisualizationFilters) => void;
  disabled?: boolean;
}) {
  const options = useMemo(() => filterOptions(items.map((item) => item.metadata)), [items]);
  const shown = items.filter((item) => matchesFilters(item.metadata, filters));
  const active = filters.category !== null || filters.difficulty !== null || filters.tag !== null;
  const set = (key: keyof VisualizationFilters) => (value: string | null) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-6">
      <fieldset
        disabled={disabled}
        aria-label="Filter visualizations"
        className="min-w-0 space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <FilterSelect
            label="Category"
            anyLabel="All categories"
            value={filters.category}
            options={options.categories}
            onChange={set("category")}
          />
          <FilterSelect
            label="Difficulty"
            anyLabel="Any difficulty"
            value={filters.difficulty}
            options={options.difficulties}
            onChange={set("difficulty")}
          />
          <FilterSelect
            label="Tag"
            anyLabel="Any tag"
            value={filters.tag}
            options={options.tags}
            onChange={set("tag")}
          />
        </div>
        <div className="flex min-h-8 items-center justify-between gap-2">
          <p role="status" className="text-sm text-muted-foreground">
            {active
              ? `Showing ${shown.length} of ${items.length} visualizations.`
              : `${items.length} visualizations.`}
          </p>
          {active && (
            <Button variant="ghost" size="sm" onClick={() => onChange(NO_FILTERS)}>
              <XIcon aria-hidden />
              Clear filters
            </Button>
          )}
        </div>
      </fieldset>
      {shown.length > 0 ? (
        <VisualizationGrid items={shown} />
      ) : (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No visualizations match these filters.
        </p>
      )}
    </div>
  );
}

/**
 * Filterable list of visualizations. Filters live in the query string
 * (`?category=…&difficulty=…&tag=…`) so a filtered view can be shared; like the
 * visualization page, the URL is mirrored with `replaceState`. Reads
 * `useSearchParams`, so render it inside `<Suspense>` with
 * `VisualizationBrowserFallback` as the fallback.
 */
export function VisualizationBrowser({ items }: { items: readonly VisualizationSummary[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filters, setFilters] = useState<VisualizationFilters>(() =>
    parseFilters(searchParams, filterOptions(items.map((item) => item.metadata))),
  );

  useEffect(() => {
    const query = serializeFilters(filters).toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  }, [filters, pathname]);

  return <BrowserView items={items} filters={filters} onChange={setFilters} />;
}

/**
 * The static HTML: every visualization, with the filters shown but disabled
 * until the page hydrates, so nothing shifts when they become usable.
 */
export function VisualizationBrowserFallback({
  items,
}: {
  items: readonly VisualizationSummary[];
}) {
  return <BrowserView items={items} filters={NO_FILTERS} onChange={() => {}} disabled />;
}
