import { beforeEach, describe, expect, it, vi } from "vitest";

const redis = {
  get: vi.fn(),
  ttl: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
};

vi.mock("@/lib/redis", () => ({ redis }));

describe("cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("passes results through when Redis works", async () => {
    const { cache } = await import("./cache");
    redis.get.mockResolvedValue("v");
    redis.ttl.mockResolvedValue(30);

    expect(await cache.get("k")).toBe("v");
    expect(await cache.ttl("k")).toBe(30);
    await cache.set("k", "v");
    await cache.setex("k", 60, "v");
    await cache.del("k");

    expect(redis.set).toHaveBeenCalledWith("k", "v");
    expect(redis.setex).toHaveBeenCalledWith("k", 60, "v");
    expect(redis.del).toHaveBeenCalledWith("k");
  });

  it("treats a Redis failure as a miss instead of throwing", async () => {
    const { cache } = await import("./cache");
    const down = new Error("ECONNRESET");
    for (const fn of Object.values(redis)) fn.mockRejectedValue(down);

    expect(await cache.get("k")).toBeNull();
    expect(await cache.ttl("k")).toBe(-2);
    await expect(cache.set("k", "v")).resolves.toBeUndefined();
    await expect(cache.setex("k", 60, "v")).resolves.toBeUndefined();
    await expect(cache.del("k")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith("[cache] get k failed:", "ECONNRESET");
  });
});
