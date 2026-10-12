import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedis(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }

  // Upstash (and other TLS endpoints) use rediss:// — ioredis enables TLS from the scheme.
  const client = new Redis(url, {
    lazyConnect: true,
    // Fail fast when Redis is down: callers either degrade (lib/cache) or fail closed.
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
  });
  // Without a listener, ioredis reports every connection error as unhandled.
  client.on("error", (err) => console.error("[redis]", err.message));
  return client;
}

export const redis = globalForRedis.redis ?? createRedis();
globalForRedis.redis = redis;
