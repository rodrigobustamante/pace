import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const syncSingleActivity = vi.fn();

vi.mock("@/services/strava/sync", () => ({
  syncSingleActivity,
}));

describe("/api/strava/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.STRAVA_WEBHOOK_VERIFY_TOKEN = "verify-secret";
  });

  describe("GET", () => {
    it("returns 403 when verify token does not match", async () => {
      const { GET } = await import("./route");
      const req = new NextRequest(
        "http://localhost/api/strava/webhook?hub.challenge=abc&hub.verify_token=wrong",
      );
      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(await res.text()).toBe("Forbidden");
    });

    it("returns hub challenge when verify token matches", async () => {
      const { GET } = await import("./route");
      const req = new NextRequest(
        "http://localhost/api/strava/webhook?hub.challenge=challenge123&hub.verify_token=verify-secret",
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ "hub.challenge": "challenge123" });
    });
  });

  describe("POST", () => {
    it("triggers sync for activity create/update and returns ok", async () => {
      syncSingleActivity.mockResolvedValue(undefined);
      const { POST } = await import("./route");
      const req = new NextRequest("http://localhost/api/strava/webhook", {
        method: "POST",
        body: JSON.stringify({
          object_type: "activity",
          aspect_type: "create",
          owner_id: 99_999,
          object_id: 12_345_678,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
      expect(syncSingleActivity).toHaveBeenCalledWith("99999", 12_345_678);
    });

    it("does not sync for unrelated events", async () => {
      const { POST } = await import("./route");
      const req = new NextRequest("http://localhost/api/strava/webhook", {
        method: "POST",
        body: JSON.stringify({
          object_type: "activity",
          aspect_type: "delete",
          owner_id: 1,
          object_id: 1,
        }),
        headers: { "Content-Type": "application/json" },
      });

      await POST(req);
      expect(syncSingleActivity).not.toHaveBeenCalled();
    });
  });
});
