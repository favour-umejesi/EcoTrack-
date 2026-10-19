/**
 * A sliding-window limiter kept in memory. It is a backstop against one member hammering a cheap action
 * (toggling reactions, adopting actions), not an accounting record: posts and reports keep their limits in the
 * database (see community-actions.ts) because those must hold across server instances. This one holds per
 * instance and resets on deploy, which is fine for its job.
 */
const hits = new Map<string, number[]>();
let sweepAt = 0;

/** True when `key` has been allowed fewer than `limit` times in the last `windowMs`; records the hit when allowed. */
export function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (now > sweepAt) sweep(now, windowMs);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return false; }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Drops keys with nothing recent so the map cannot grow without bound. */
function sweep(now: number, windowMs: number) {
  for (const [k, ts] of hits) if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
  sweepAt = now + 60_000;
}

/** Test hook. */
export function resetRateLimits() { hits.clear(); sweepAt = 0; }

export const RATE = {
  /** Reactions toggled per member per ten minutes. */
  reactions: { limit: 60, windowMs: 10 * 60_000 },
  /** Actions adopted or dropped per member per ten minutes. */
  actions: { limit: 30, windowMs: 10 * 60_000 },
} as const;
