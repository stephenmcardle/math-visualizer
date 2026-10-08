/**
 * Render quality levels. Quality is a per-device concern, so it is not stored
 * in the URL and must never change simulation results — only how they are
 * drawn.
 */

export type QualityLevel = "low" | "medium" | "high";
export type QualitySetting = QualityLevel | "auto";

export const QUALITY_SETTINGS: readonly QualitySetting[] = ["auto", "low", "medium", "high"];

export interface QualityProfile {
  level: QualityLevel;
  /** Canvas pixel density (renderer resolution), capped below devicePixelRatio. */
  resolution: number;
}

const RESOLUTION_CAP: Record<QualityLevel, number> = { low: 1, medium: 1.5, high: 2 };

export function qualityProfile(level: QualityLevel, devicePixelRatio: number): QualityProfile {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  return { level, resolution: Math.min(dpr, RESOLUTION_CAP[level]) };
}

export interface DeviceHints {
  devicePixelRatio: number;
  hardwareConcurrency?: number;
  /** Viewport width in CSS pixels. */
  viewportWidth: number;
}

/** Initial guess for "auto"; `FrameTimeMonitor` corrects it at runtime. */
export function detectAutoLevel(hints: DeviceHints): QualityLevel {
  const cores = hints.hardwareConcurrency ?? 4;
  if (cores <= 4) return "low";
  // Small, dense screens (phones) pay the most for high resolution.
  if (hints.viewportWidth < 768 && hints.devicePixelRatio > 2) return "medium";
  return cores >= 8 ? "high" : "medium";
}

export function lowerQuality(level: QualityLevel): QualityLevel | null {
  if (level === "high") return "medium";
  if (level === "medium") return "low";
  return null;
}

/**
 * Tracks average frame time and reports when it stays above budget, so
 * "auto" quality can step down. Deliberately simple: an exponential moving
 * average plus a minimum sample count before each decision.
 */
export class FrameTimeMonitor {
  private average = 0;
  private samples = 0;
  private last: number | null = null;

  constructor(
    private readonly budgetMs = 1000 / 40,
    private readonly minSamples = 90,
  ) {}

  reset(): void {
    this.average = 0;
    this.samples = 0;
    this.last = null;
  }

  /** Feed a frame timestamp; returns `true` when the frame budget is persistently exceeded. */
  sample(now: number): boolean {
    if (this.last !== null) {
      const dt = now - this.last;
      // Ignore huge gaps (tab switches, debugger) rather than treating them as slow frames.
      if (dt < 250) {
        this.average = this.samples === 0 ? dt : this.average * 0.95 + dt * 0.05;
        this.samples++;
      }
    }
    this.last = now;
    if (this.samples >= this.minSamples && this.average > this.budgetMs) {
      this.reset();
      return true;
    }
    return false;
  }
}
