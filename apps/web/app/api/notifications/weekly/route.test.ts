import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { user: { findMany } } }));

const request = (auth?: string) =>
  new NextRequest("https://pace.test/api/notifications/weekly", {
    headers: auth ? { authorization: auth } : {},
  });

describe("/api/notifications/weekly", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("answers GET, which is what Vercel Cron sends, and keeps POST", async () => {
    const route = await import("./route");
    expect(route.POST).toBe(route.GET);
  });

  it("rejects requests without the cron secret", async () => {
    const { GET } = await import("./route");
    expect((await GET(request())).status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("does nothing when no user has a push token", async () => {
    findMany.mockResolvedValue([]);
    const { GET } = await import("./route");
    const res = await GET(request("Bearer s3cret"));
    expect(await res.json()).toEqual({ sent: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends one push per user and counts the accepted ones", async () => {
    findMany.mockResolvedValue([
      { id: "u1", name: "Ana Pérez", expoPushToken: "ExponentPushToken[a]" },
      { id: "u2", name: "Luis", expoPushToken: "ExponentPushToken[b]" },
    ]);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ status: "ok" }, { status: "error", message: "DeviceNotRegistered" }] }),
    });
    const { GET } = await import("./route");

    const res = await GET(request("Bearer s3cret"));

    expect(await res.json()).toEqual({ sent: 1, total: 2 });
    const sent = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(sent[0]).toMatchObject({ to: "ExponentPushToken[a]", data: { screen: "coach" } });
    expect(sent[0].body).toContain("Ana");
  });
});
