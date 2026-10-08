"use client";

import { DicesIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SEED, randomSeed } from "@/lib/random/prng";

function parseSeedInput(text: string): number | null {
  if (!/^\d{1,10}$/.test(text.trim())) return null;
  const seed = Number(text.trim());
  return seed <= MAX_SEED ? seed : null;
}

export function SeedControl({
  seed,
  onChange,
}: {
  seed: number;
  onChange: (seed: number) => void;
}) {
  const inputId = useId();
  const hintId = useId();
  // Local draft so typing doesn't restart the simulation on every keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parseSeedInput(draft) === null;

  const commit = () => {
    if (draft === null) return;
    const parsed = parseSeedInput(draft);
    if (parsed !== null && parsed !== seed) onChange(parsed);
    setDraft(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Seed</Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          inputMode="numeric"
          autoComplete="off"
          value={draft ?? String(seed)}
          aria-invalid={invalid}
          aria-describedby={hintId}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit();
            if (event.key === "Escape") setDraft(null);
          }}
          className="font-mono tabular-nums"
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="Random seed"
          onClick={() => {
            setDraft(null);
            onChange(randomSeed());
          }}
        >
          <DicesIcon aria-hidden />
        </Button>
      </div>
      <p
        id={hintId}
        className={invalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}
      >
        {invalid
          ? `Enter a whole number from 0 to ${MAX_SEED}.`
          : "Same seed and parameters give the same run."}
      </p>
    </div>
  );
}
