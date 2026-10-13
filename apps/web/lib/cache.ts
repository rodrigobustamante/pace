import { redis } from "@/lib/redis";

/**
 * Redis as a best-effort cache: a failed command is logged and treated as a
 * miss, so a Redis outage makes requests slower instead of failing them.
 *
 * Auth state (mobile refresh tokens, session codes) must not go through here:
 * it uses `redis` directly so that it fails closed.
 */
async function attempt<T>(op: string, key: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[cache] ${op} ${key} failed:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

export const cache = {
  get: (key: string) => attempt("get", key, () => redis.get(key), null),
  /** Seconds left on `key`; -2 (no key) when Redis is unreachable. */
  ttl: (key: string) => attempt("ttl", key, () => redis.ttl(key), -2),
  set: (key: string, value: string) =>
    attempt("set", key, async () => void (await redis.set(key, value)), undefined),
  setex: (key: string, seconds: number, value: string) =>
    attempt("setex", key, async () => void (await redis.setex(key, seconds, value)), undefined),
  del: (key: string) => attempt("del", key, async () => void (await redis.del(key)), undefined),
};
