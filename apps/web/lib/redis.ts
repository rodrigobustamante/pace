import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  // Upstash (and other TLS endpoints) use rediss:// — ioredis enables TLS from the scheme.
  return new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
}

export const redis = globalForRedis.redis ?? createRedis();
globalForRedis.redis = redis;
