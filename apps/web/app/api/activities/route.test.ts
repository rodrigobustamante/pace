import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserFromRequest = vi.fn();
const activityFindMany = vi.fn();
const activityCount = vi.fn();

vi.mock("@/lib/auth", () => ({
  getUserFromRequest,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    activity: {
      findMany: activityFindMany,
      count: activityCount,
    },
  },
}));

describe("GET /api/activities", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 401 without user", async () => {
    getUserFromRequest.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET(new NextRequest("http://localhost/api/activities"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid query params", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    const { GET } = await import("./route");
    const res = await GET(
      new NextRequest("http://localhost/api/activities?page=0&limit=200"),
    );
    expect(res.status).toBe(400);
  });

  it("returns paginated activities", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    activityFindMany.mockResolvedValue([{ id: "a1", name: "Easy" }]);
    activityCount.mockResolvedValue(25);

    const { GET } = await import("./route");
    const res = await GET(
      new NextRequest("http://localhost/api/activities?page=2&limit=10"),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activities).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(activityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        skip: 10,
        take: 10,
      }),
    );
  });
});
