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

/** Initial guess for "auto"; `AutoQuality` corrects it at runtime. */
export function detectAutoLevel(hints: DeviceHints): QualityLevel {
  const cores = hints.hardwareConcurrency ?? 4;
  if (cores <= 4) return "low";
  // Small, dense screens (phones) pay the most for high resolution.
  if (hints.viewportWidth < 768 && hints.devicePixelRatio > 2) return "medium";
  return cores >= 8 ? "high" : "medium";
}

const LEVELS: readonly QualityLevel[] = ["low", "medium", "high"];

/** Frame times are judged as the mean over windows of this many frames. */
const WINDOW_FRAMES = 90;
/** A window averaging more than this (under 40 fps) steps down. */
const SLOW_FRAME_MS = 1000 / 40;
/** A window averaging less than this (about 50 fps or better; 60 Hz frames are 16.7 ms) is fast. */
const FAST_FRAME_MS = 1000 / 50;
/** Frames in consecutive fast windows before the first step up (about 10 s at 60 fps)… */
const FAST_FRAMES_INITIAL = 600;
/** …doubling after every step down, up to about 3 minutes. */
const FAST_FRAMES_MAX = 9600;
/** Gaps longer than this (tab switches, debugger) are ignored rather than counted as slow frames. */
const MAX_FRAME_GAP_MS = 250;

/**
 * Chooses the level for the "auto" setting from frame times. It steps down
 * one level when a window of frames is over budget, and back up (never above
 * the starting level, the device heuristic's guess) after a long run of fast
 * windows, so a temporary slowdown doesn't lower quality for good. Each step
 * down doubles the run needed to step up again, so a device that can't
 * sustain a level settles below it instead of oscillating.
 *
 * Window means, unlike a moving average, shrug off the odd long frame (a
 * garbage collection), which would otherwise keep resetting the fast run.
 * Frame times come from requestAnimationFrame, so a fast device reads as the
 * display's refresh interval: fast means "keeping up", not "idle".
 */
export class AutoQuality {
  private readonly ceiling: number;
  private index: number;
  private windowTime = 0;
  private windowFrames = 0;
  private fastFrames = 0;
  private fastNeeded = FAST_FRAMES_INITIAL;
  private last: number | null = null;

  constructor(initial: QualityLevel) {
    this.index = LEVELS.indexOf(initial);
    this.ceiling = this.index;
  }

  get level(): QualityLevel {
    return LEVELS[this.index];
  }

  /** Forget timing, e.g. after the tab was hidden or the level changed. */
  resetTiming(): void {
    this.windowTime = 0;
    this.windowFrames = 0;
    this.fastFrames = 0;
    this.last = null;
  }

  /** Feed a frame timestamp; returns the new level when it changes, otherwise null. */
  sample(now: number): QualityLevel | null {
    const last = this.last;
    this.last = now;
    if (last === null || now - last >= MAX_FRAME_GAP_MS) return null;

    this.windowTime += now - last;
    this.windowFrames++;
    if (this.windowFrames < WINDOW_FRAMES) return null;

    const mean = this.windowTime / this.windowFrames;
    const frames = this.windowFrames;
    this.windowTime = 0;
    this.windowFrames = 0;

    if (mean > SLOW_FRAME_MS && this.index > 0) {
      this.index--;
      this.fastNeeded = Math.min(this.fastNeeded * 2, FAST_FRAMES_MAX);
      this.resetTiming();
      return this.level;
    }
    this.fastFrames = mean < FAST_FRAME_MS ? this.fastFrames + frames : 0;
    if (this.fastFrames >= this.fastNeeded && this.index < this.ceiling) {
      this.index++;
      this.resetTiming();
      return this.level;
    }
    return null;
  }
}
