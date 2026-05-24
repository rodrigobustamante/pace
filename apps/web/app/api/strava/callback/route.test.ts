import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppBaseUrl = vi.fn();
const encrypt = vi.fn((s: string) => `enc:${s}`);
const exchangeAuthorizationCode = vi.fn();
const waitUntil = vi.fn((p: Promise<unknown>) => p);
const syncActivities = vi.fn();
const redisSetex = vi.fn();
const redisDel = vi.fn();

const prismaUserUpsert = vi.fn();

vi.mock("@/lib/appBaseUrl", () => ({
  getAppBaseUrl,
}));

vi.mock("@/lib/crypto", () => ({
  encrypt,
}));

vi.mock("@/lib/strava/tokenRequest", () => ({
  exchangeAuthorizationCode,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { upsert: prismaUserUpsert },
  },
}));

vi.mock("@/lib/redis", () => ({
  redis: { setex: redisSetex, del: redisDel },
}));

vi.mock("@/services/strava/sync", () => ({
  syncActivities,
}));

vi.mock("@vercel/functions", () => ({
  waitUntil,
}));

describe("GET /api/strava/callback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getAppBaseUrl.mockReturnValue("https://app.example.com");
    prismaUserUpsert.mockResolvedValue({ id: "user-1" });
    syncActivities.mockResolvedValue(undefined);
    redisSetex.mockResolvedValue("OK");
  });

  it("redirects to auth error when Strava returns error", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest(
      "http://localhost/api/strava/callback?error=access_denied",
    );
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toContain("/auth/error");
    expect(res.headers.get("Location")).toContain("reason=access_denied");
  });

  it("redirects to auth error when code is missing", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/strava/callback");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toContain("reason=no_code");
  });

  it("redirects when token exchange fails", async () => {
    exchangeAuthorizationCode.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "bad request",
    });

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/strava/callback?code=abc");
    const res = await GET(req);

    expect(res.status).toBe(307);
    const loc = res.headers.get("Location") ?? "";
    expect(loc).toContain("reason=token_exchange_failed");
    expect(loc).toContain("status=400");
  });

  it("sets cookie and redirects to dashboard on success (web)", async () => {
    exchangeAuthorizationCode.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "at",
        refresh_token: "rt",
        expires_at: 1_700_000_000,
        athlete: {
          id: 55_555,
          firstname: "Ada",
          lastname: "Runner",
          profile: "https://cdn.example/p.jpg",
        },
      }),
    });

    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost:3000/api/strava/callback?code=good");
    const res = await GET(req);

    process.env.NODE_ENV = prevEnv;

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toContain("/dashboard");
    const setCookie = res.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("pace_user_id=user-1");
    expect(prismaUserUpsert).toHaveBeenCalled();
    expect(waitUntil).toHaveBeenCalled();
    // Web flow must NOT write to Redis
    expect(redisSetex).not.toHaveBeenCalled();
  });

  it("generates sessionCode and redirects to mobile deep link", async () => {
    exchangeAuthorizationCode.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "at",
        refresh_token: "rt",
        expires_at: 1_700_000_000,
        athlete: {
          id: 55_555,
          firstname: "Ada",
          lastname: "Runner",
          profile: "https://cdn.example/p.jpg",
        },
      }),
    });

    const { GET } = await import("./route");
    // platform + redirect are encoded in the OAuth state param (base64 JSON)
    const state = Buffer.from(
      JSON.stringify({ platform: "mobile", redirect: "pace://auth/callback" }),
    ).toString("base64");
    const req = new NextRequest(
      `http://localhost/api/strava/callback?code=good&state=${encodeURIComponent(state)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const loc = res.headers.get("Location") ?? "";
    expect(loc).toContain("pace://auth/callback");
    expect(loc).toContain("sessionCode=");
    // Must NOT expose raw userId
    expect(loc).not.toContain("userId=");
    // Must have stored the code in Redis with 5-min TTL
    expect(redisSetex).toHaveBeenCalledWith(
      expect.stringContaining("mobile:session:"),
      300,
      "user-1",
    );
  });

  it("redirects to internal_error when upsert throws", async () => {
    exchangeAuthorizationCode.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "at",
        refresh_token: "rt",
        expires_at: 1_700_000_000,
        athlete: {
          id: 55_555,
          firstname: "Ada",
          lastname: "Runner",
          profile: "https://cdn.example/p.jpg",
        },
      }),
    });
    prismaUserUpsert.mockRejectedValue(new Error("db down"));

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/strava/callback?code=good");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toContain("reason=internal_error");
  });
});
