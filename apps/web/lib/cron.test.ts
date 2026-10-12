import { afterEach, describe, expect, it, vi } from "vitest";
import { isCronRequest } from "./cron";

const request = (auth?: string) =>
  new Request("https://pace.test/api/cron", { headers: auth ? { authorization: auth } : {} });

describe("isCronRequest", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the configured secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isCronRequest(request("Bearer s3cret"))).toBe(true);
    expect(isCronRequest(request("Bearer nope"))).toBe(false);
    expect(isCronRequest(request())).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronRequest(request("Bearer undefined"))).toBe(false);
    expect(isCronRequest(request("Bearer "))).toBe(false);
  });
});
