/**
 * Converts wall-clock frame times into a whole number of fixed simulation
 * steps. Frame rate affects how smoothly a run plays, never what it computes.
 */
export class StepClock {
  private last: number | null = null;
  private pending = 0;

  constructor(private readonly maxStepsPerFrame = 1000) {}

  reset(): void {
    this.last = null;
    this.pending = 0;
  }

  /** Steps to run this frame at `stepsPerSecond`. The first call after a reset returns 0. */
  tick(now: number, stepsPerSecond: number): number {
    if (this.last === null) {
      this.last = now;
      return 0;
    }
    // Clamp long gaps (background tab, breakpoints) so we don't try to catch up.
    const dtSeconds = Math.min(Math.max(now - this.last, 0), 250) / 1000;
    this.last = now;
    this.pending += dtSeconds * stepsPerSecond;
    const steps = Math.min(Math.floor(this.pending), this.maxStepsPerFrame);
    this.pending -= steps;
    // If we hit the cap, drop the backlog instead of carrying it forward forever.
    if (this.pending >= this.maxStepsPerFrame) this.pending = 0;
    return steps;
  }
}
