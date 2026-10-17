import type { Context } from 'hono';

/** Allows at most `maxEvents` per key within a rolling window. State lives per Worker isolate. */
export class SlidingWindowLimiter {
  private readonly events = new Map<string, number[]>();

  constructor(
    private readonly maxEvents: number,
    private readonly windowMs: number,
  ) {}

  allow(key: string, now = Date.now()): boolean {
    if (this.events.size > 1000) this.sweep(now);
    const recent = (this.events.get(key) ?? []).filter((time) => now - time <= this.windowMs);
    const allowed = recent.length < this.maxEvents;
    if (allowed) recent.push(now);
    this.events.set(key, recent);
    return allowed;
  }

  reset(): void {
    this.events.clear();
  }

  private sweep(now: number): void {
    for (const [key, times] of this.events) {
      if (times.every((time) => now - time > this.windowMs)) this.events.delete(key);
    }
  }
}

export const loginLimiter = new SlidingWindowLimiter(10, 15 * 60 * 1000);
export const inquiryLimiter = new SlidingWindowLimiter(5, 15 * 60 * 1000);

export function clientIp(c: Context): string {
  return c.req.header('cf-connecting-ip') ?? 'unknown';
}
