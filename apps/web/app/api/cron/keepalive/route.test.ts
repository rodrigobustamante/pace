import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const userCount = vi.fn();
const redisSet = vi.fn();

vi.mock("@/lib/db", () => ({ prisma: { user: { count: userCount } } }));
vi.mock("@/lib/redis", () => ({ redis: { set: redisSet } }));

const request = (auth?: string) =>
  new NextRequest("https://pace.test/api/cron/keepalive", {
    headers: auth ? { authorization: auth } : {},
  });

describe("/api/cron/keepalive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rejects requests without the cron secret", async () => {
    const { GET } = await import("./route");
    const res = await GET(request("Bearer nope"));
    expect(res.status).toBe(401);
    expect(userCount).not.toHaveBeenCalled();
  });

  it("queries Postgres and writes to Redis", async () => {
    userCount.mockResolvedValue(3);
    redisSet.mockResolvedValue("OK");
    const { GET } = await import("./route");

    const res = await GET(request("Bearer s3cret"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ db: "ok", redis: "ok" });
    expect(redisSet).toHaveBeenCalledWith("keepalive:last", expect.any(String), "EX", 604800);
  });

  it("returns 500 when a store is unreachable", async () => {
    userCount.mockResolvedValue(3);
    redisSet.mockRejectedValue(new Error("ENOTFOUND"));
    const { GET } = await import("./route");

    const res = await GET(request("Bearer s3cret"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ db: "ok", redis: "Error: ENOTFOUND" });
  });
});
