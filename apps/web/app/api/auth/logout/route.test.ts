import { describe, expect, it } from "vitest";

describe("POST /api/auth/logout", () => {
  it("redirects to home with 303 and clears session cookie", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://pace.example.com/api/auth/logout", { method: "POST" }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("https://pace.example.com/");
    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toContain("pace_user_id=");
    expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=/);
  });
});
