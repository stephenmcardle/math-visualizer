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
import { QUALITY_SETTINGS, type QualityLevel, type QualitySetting } from "@/lib/rendering/quality";

const LABELS: Record<QualitySetting, string> = {
  auto: "Auto",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function QualityControl({
  value,
  activeLevel,
  onChange,
}: {
  value: QualitySetting;
  /** The level in effect, shown when the setting is "auto". */
  activeLevel: QualityLevel | null;
  onChange: (value: QualitySetting) => void;
}) {
  const labelId = useId();
  return (
    <div className="space-y-2">
      <Label id={labelId}>Render quality</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next as QualitySetting);
        }}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full">
          <SelectValue>
            {(current: QualitySetting) =>
              current === "auto" && activeLevel
                ? `Auto (${LABELS[activeLevel].toLowerCase()})`
                : LABELS[current]
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {QUALITY_SETTINGS.map((setting) => (
            <SelectItem key={setting} value={setting}>
              {LABELS[setting]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Affects sharpness and detail only, never the simulation.
      </p>
    </div>
  );
}
