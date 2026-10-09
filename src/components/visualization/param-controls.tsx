"use client";

import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type {
  BooleanParamSpec,
  EnumParamSpec,
  NumberParamSpec,
  ParamSchema,
  ParamValue,
} from "@/lib/url-state/params";

function Description({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {text}
    </p>
  );
}

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
      <Description id={descriptionId} text={spec.description} />
    </div>
  );
}

function ParamSwitch({
  spec,
  value,
  onChange,
}: {
  spec: BooleanParamSpec;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label id={labelId}>{spec.label}</Label>
        <Switch
          aria-labelledby={labelId}
          aria-describedby={spec.description ? descriptionId : undefined}
          checked={value}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
      <Description id={descriptionId} text={spec.description} />
    </div>
  );
}

function ParamSelect({
  spec,
  value,
  onChange,
}: {
  spec: EnumParamSpec;
  value: string;
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  const descriptionId = useId();
  const labelOf = (v: string) => spec.options.find((option) => option.value === v)?.label ?? v;
  return (
    <div className="space-y-2">
      <Label id={labelId}>{spec.label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next as string);
        }}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          aria-describedby={spec.description ? descriptionId : undefined}
          className="w-full"
        >
          <SelectValue>{(current: string) => labelOf(current)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {spec.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Description id={descriptionId} text={spec.description} />
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
  values: Record<string, ParamValue>;
  onChange: (key: string, value: ParamValue) => void;
}) {
  return (
    <div className="space-y-6">
      {Object.entries(schema).map(([key, spec]) => {
        const change = (v: ParamValue) => onChange(key, v);
        switch (spec.type) {
          case "boolean":
            return (
              <ParamSwitch key={key} spec={spec} value={values[key] as boolean} onChange={change} />
            );
          case "enum":
            return (
              <ParamSelect key={key} spec={spec} value={values[key] as string} onChange={change} />
            );
          default:
            return (
              <ParamSlider key={key} spec={spec} value={values[key] as number} onChange={change} />
            );
        }
      })}
    </div>
  );
}
