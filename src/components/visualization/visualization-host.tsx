"use client";

import {
  ImageDownIcon,
  LinkIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ParamControls } from "@/components/visualization/param-controls";
import { QualityControl } from "@/components/visualization/quality-control";
import { SeedControl } from "@/components/visualization/seed-control";
import {
  VisualizationViewport,
  type ViewportHandle,
} from "@/components/visualization/visualization-viewport";
import type { QualityLevel, QualitySetting } from "@/lib/rendering/quality";
import { shareUrl, type ParamValue } from "@/lib/url-state/params";
import type { AnyVisualizationDefinition } from "@/lib/visualization/types";
import { useVisualizationUrlState } from "@/lib/url-state/use-visualization-url-state";
import { visualizations } from "@/visualizations/registry";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const STATUS_CLEAR_MS = 4000;

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // The download has started by the time click() returns; the URL isn't needed after that.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ControlPanel(props: {
  definition: AnyVisualizationDefinition;
  params: Record<string, ParamValue>;
  onParamChange: (key: string, value: ParamValue) => void;
  seed: number;
  onSeedChange: (seed: number) => void;
  quality: QualitySetting;
  activeLevel: QualityLevel | null;
  onQualityChange: (quality: QualitySetting) => void;
}) {
  // Rendered both in the desktop aside and the mobile sheet, so ids must be unique.
  const paramsHeading = useId();
  const runHeading = useId();
  return (
    <div className="space-y-6">
      <section aria-labelledby={paramsHeading} className="space-y-4">
        <h2 id={paramsHeading} className="text-sm font-semibold">
          Parameters
        </h2>
        <ParamControls
          schema={props.definition.params}
          values={props.params}
          onChange={props.onParamChange}
        />
      </section>
      <Separator />
      <section aria-labelledby={runHeading} className="space-y-4">
        <h2 id={runHeading} className="text-sm font-semibold">
          Run
        </h2>
        <SeedControl seed={props.seed} onChange={props.onSeedChange} />
        <QualityControl
          value={props.quality}
          activeLevel={props.activeLevel}
          onChange={props.onQualityChange}
        />
      </section>
    </div>
  );
}

/**
 * Generic host for any registered visualization: URL-backed params and seed,
 * playback state, the viewport, and the control panel. Nothing in here is
 * specific to one visualization.
 */
export function VisualizationHost({ slug }: { slug: string }) {
  const definition = visualizations.get(slug);
  if (!definition) throw new Error(`Unknown visualization "${slug}"`);

  const { params, seed, setParam, setSeed } = useVisualizationUrlState(definition.params);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [playing, setPlaying] = useState(() => !reducedMotion);
  const [quality, setQuality] = useState<QualitySetting>("auto");
  const [activeLevel, setActiveLevel] = useState<QualityLevel | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const viewportRef = useRef<ViewportHandle>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), STATUS_CLEAR_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copyLink = async () => {
    // Built from current state rather than the address bar, which updates after a short delay.
    const url = shareUrl(window.location.href, definition.params, params, seed);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setStatus("Link copied. It replays this run from the start.");
    } catch (error) {
      console.error("Copying the link failed:", error);
      setStatus("Couldn't copy the link. Copy it from the address bar instead.");
    }
  };

  const saveImage = async () => {
    try {
      const blob = await viewportRef.current!.capture();
      downloadBlob(blob, `${slug}-seed-${seed}.png`);
      setStatus("Image saved.");
    } catch (error) {
      console.error("Saving the image failed:", error);
      setStatus("Couldn't save the image.");
    }
  };

  const controls = (
    <ControlPanel
      definition={definition}
      params={params}
      onParamChange={setParam}
      seed={seed}
      onSeedChange={setSeed}
      quality={quality}
      activeLevel={activeLevel}
      onQualityChange={setQuality}
    />
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-3">
        <VisualizationViewport
          ref={viewportRef}
          definition={definition}
          params={params}
          seed={seed}
          playing={playing}
          quality={quality}
          resetToken={resetToken}
          onQualityLevelChange={setActiveLevel}
          className="h-[60svh] min-h-72 overflow-hidden rounded-xl border bg-card lg:h-[min(72svh,760px)]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setPlaying((p) => !p)} className="min-w-24">
            {playing ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
            {playing ? "Pause" : "Play"}
          </Button>
          {/* Icon-only below `sm` so the row, including Controls, fits a phone. */}
          <Button variant="outline" onClick={() => setResetToken((t) => t + 1)} aria-label="Reset">
            <RotateCcwIcon aria-hidden />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button variant="outline" onClick={copyLink} aria-label="Copy link">
            <LinkIcon aria-hidden />
            <span className="hidden sm:inline">Copy link</span>
          </Button>
          <Button variant="outline" onClick={saveImage} aria-label="Save image">
            <ImageDownIcon aria-hidden />
            <span className="hidden sm:inline">Save image</span>
          </Button>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="ml-auto lg:hidden" />}>
              <SlidersHorizontalIcon aria-hidden />
              Controls
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Controls</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">{controls}</div>
            </SheetContent>
          </Sheet>
        </div>
        <p role="status" className="min-h-5 text-sm text-muted-foreground">
          {status}
        </p>
        {reducedMotion && !playing && (
          <p className="text-sm text-muted-foreground">
            Animation starts paused because your system requests reduced motion. Press Play to
            start.
          </p>
        )}
      </div>
      <aside aria-label="Controls" className="hidden rounded-xl border p-4 lg:block lg:self-start">
        {controls}
      </aside>
    </div>
  );
}
