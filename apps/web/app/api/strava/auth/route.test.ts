import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAppBaseUrl = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/appBaseUrl", () => ({
  getAppBaseUrl,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("GET /api/strava/auth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.STRAVA_CLIENT_ID = "12345";
    getAppBaseUrl.mockReturnValue("https://app.example.com");
  });

  it("redirects to Strava OAuth with callback and scope", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/strava/auth");

    await expect(GET(req)).rejects.toThrow("REDIRECT:");
    expect(redirect).toHaveBeenCalledTimes(1);
    const url = redirect.mock.calls[0]?.[0] as string;
    expect(url).toContain("https://www.strava.com/oauth/authorize");
    expect(url).toContain("client_id=12345");
    expect(url).toContain("scope=activity%3Aread_all");
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fstrava%2Fcallback",
    );
  });

  it("encodes platform and redirect in the OAuth state param (not redirect_uri)", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest(
      "http://localhost/api/strava/auth?platform=mobile&redirect=myapp%3A%2F%2Fcb",
    );

    await expect(GET(req)).rejects.toThrow("REDIRECT:");
    const url = redirect.mock.calls[0]?.[0] as string;
    const parsed = new URL(url);

    // redirect_uri must be the clean callback URL — no extra query params
    const redirectUri = parsed.searchParams.get("redirect_uri") ?? "";
    expect(redirectUri).toBe("https://app.example.com/api/strava/callback");
    expect(redirectUri).not.toContain("platform");
    expect(redirectUri).not.toContain("redirect");

    // platform + redirect must be encoded in the state param as base64 JSON
    const state = parsed.searchParams.get("state") ?? "";
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8")) as {
      platform?: string;
      redirect?: string;
    };
    expect(decoded.platform).toBe("mobile");
    expect(decoded.redirect).toBe("myapp://cb");
  });
});
