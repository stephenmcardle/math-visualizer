"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { NumberParamSpec, ParamSchema } from "@/lib/url-state/params";

function ParamSlider({
  spec,
  value,
  onChange,
}: {
  spec: NumberParamSpec;
  value: number;
  onChange: (value: number) => void;
}) {
  const labelId = useId();
  const descriptionId = useId();
  const valueText = spec.unit ? `${value} ${spec.unit}` : String(value);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <Label id={labelId}>{spec.label}</Label>
        <output className="font-mono text-xs text-muted-foreground tabular-nums" aria-live="off">
          {valueText}
        </output>
      </div>
      <Slider
        aria-labelledby={labelId}
        aria-describedby={spec.description ? descriptionId : undefined}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
        className="py-2"
      />
      {spec.description && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {spec.description}
        </p>
      )}
    </div>
  );
}

/** Generic controls generated from a visualization's parameter schema. */
export function ParamControls({
  schema,
  values,
  onChange,
}: {
  schema: ParamSchema;
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}) {
  return (
    <div className="space-y-6">
      {Object.entries(schema).map(([key, spec]) => (
        <ParamSlider key={key} spec={spec} value={values[key]} onChange={(v) => onChange(key, v)} />
      ))}
    </div>
  );
}
