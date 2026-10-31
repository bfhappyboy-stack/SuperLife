/**
 * Tiny haptics helper. Phones that support the Vibration API get a short buzz on hits, wins and
 * misses; everything else (desktop, iOS Safari) silently ignores it.
 */
export type Buzz = "tap" | "hit" | "big" | "miss" | "win";

const PATTERNS: Record<Buzz, number | number[]> = {
  tap: 8,
  hit: 18,
  big: [24, 40, 36],
  miss: [40, 30, 40],
  win: [16, 50, 16, 50, 60],
};

export function buzz(kind: Buzz): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw when vibration is blocked by policy; haptics are a nicety, never an error.
  }
}
