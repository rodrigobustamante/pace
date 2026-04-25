import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const syncActivities = vi.fn();
const redisTtl = vi.fn();
const redisGet = vi.fn();
const redisSetex = vi.fn();
const redisSet = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentUser,
}));

vi.mock("@/services/strava/sync", () => ({
  syncActivities,
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    ttl: redisTtl,
    get: redisGet,
    setex: redisSetex,
    set: redisSet,
  },
}));

describe("/api/strava/sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    syncActivities.mockResolvedValue(undefined);
  });

  it("GET returns 401 without user", async () => {
    getCurrentUser.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns sync status when user is present", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    redisTtl.mockResolvedValue(120);
    redisGet.mockResolvedValue("2026-01-01T00:00:00.000Z");

    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      canSync: false,
      remainingSeconds: 120,
      lastSyncAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("GET returns canSync true when cooldown expired and no last sync", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    redisTtl.mockResolvedValue(-1);
    redisGet.mockResolvedValue(null);

    const { GET } = await import("./route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      canSync: true,
      remainingSeconds: 0,
      lastSyncAt: null,
    });
  });

  it("POST returns 401 without user", async () => {
    getCurrentUser.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("POST returns 429 when cooldown active", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    redisTtl.mockResolvedValue(900);

    const { POST } = await import("./route");
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toMatchObject({ error: "Sync en cooldown", remainingSeconds: 900 });
    expect(redisSetex).not.toHaveBeenCalled();
  });

  it("POST starts sync and sets cooldown keys", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1" });
    redisTtl.mockResolvedValue(-1);

    const { POST } = await import("./route");
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(typeof body.lastSyncAt).toBe("string");
    expect(redisSetex).toHaveBeenCalledWith("sync:cooldown:u1", 3600, "1");
    expect(redisSet).toHaveBeenCalledWith("sync:last:u1", body.lastSyncAt);
    expect(syncActivities).toHaveBeenCalledWith("u1");
  });
});
