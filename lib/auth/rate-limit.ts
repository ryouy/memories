type Attempt = {
  count: number;
  windowStartedAt: number;
  failed: number;
  lockedUntil?: number;
};

const attempts = new Map<string, Attempt>();
const minute = 60_000;
const lockMs = 15 * minute;

export function checkLoginLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.windowStartedAt > minute) {
    const fresh = { count: 0, failed: current?.failed ?? 0, windowStartedAt: now, lockedUntil: current?.lockedUntil };
    attempts.set(key, fresh);
    return { allowed: !fresh.lockedUntil || fresh.lockedUntil <= now };
  }
  if (current.lockedUntil && current.lockedUntil > now) return { allowed: false };
  return { allowed: current.count < 10 };
}

export function recordLoginAttempt(key: string, success: boolean) {
  const now = Date.now();
  const current = attempts.get(key) ?? { count: 0, failed: 0, windowStartedAt: now };
  current.count += 1;
  if (success) {
    attempts.delete(key);
    return;
  }
  current.failed += 1;
  if (current.failed >= 5) current.lockedUntil = now + lockMs;
  attempts.set(key, current);
}
