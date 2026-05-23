import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserFromRequest = vi.fn();
const goalFindFirst = vi.fn();
const goalFindMany = vi.fn();
const goalCreate = vi.fn();
const goalDelete = vi.fn();
const generateAndPersistTrainingPlan = vi.fn();

vi.mock("@/lib/auth", () => ({
  getUserFromRequest,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    goal: {
      findFirst: goalFindFirst,
      findMany: goalFindMany,
      create: goalCreate,
      delete: goalDelete,
    },
  },
}));

vi.mock("@/services/goals/trainingPlanGeneration", () => ({
  generateAndPersistTrainingPlan,
}));

describe("/api/goals", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 without user", async () => {
      getUserFromRequest.mockResolvedValue(null);
      const { GET } = await import("./route");
      const res = await GET(new NextRequest("http://localhost/api/goals"));
      expect(res.status).toBe(401);
    });

    it("returns all active goals when present", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      goalFindMany.mockResolvedValue([{ id: "g1", title: "10K" }]);

      const { GET } = await import("./route");
      const res = await GET(new NextRequest("http://localhost/api/goals"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ goals: [{ id: "g1", title: "10K" }] });
    });

    it("returns empty list when no active goals", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      goalFindMany.mockResolvedValue([]);

      const { GET } = await import("./route");
      const res = await GET(new NextRequest("http://localhost/api/goals"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ goals: [] });
    });
  });

  describe("POST", () => {
    const futureDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    };

    it("returns 401 without user", async () => {
      getUserFromRequest.mockResolvedValue(null);
      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 400 for missing goalType", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      const { POST } = await import("./route");
      // goalType is missing → body.goalType is not a string → 400
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({ title: "Objetivo", targetDate: futureDate() }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid date string", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({
            title: "Objetivo",
            goalType: "race_10k",
            targetDate: "not-a-date",
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toContain("Fecha inválida");
    });

    it("returns 400 when target date is not in the future", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({
            title: "Objetivo",
            goalType: "race_10k",
            targetDate: "2020-01-01",
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(400);
      expect(body.error).toContain("futuro");
    });

    it("returns 409 when a milestone already exists on that date", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      goalFindFirst.mockResolvedValue({ id: "existing-goal" });

      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({
            title: "Objetivo",
            goalType: "race_10k",
            targetDate: futureDate(),
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );
      const body = await res.json();
      expect(res.status).toBe(409);
      expect(body.error).toContain("hito registrado");
    });

    it("returns 500 and deletes goal when plan generation fails", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      // No duplicate on this date
      goalFindFirst.mockResolvedValue(null);
      goalCreate.mockResolvedValue({
        id: "g-new",
        title: "Maratón",
        goalType: "marathon",
      });
      // No other milestones
      goalFindMany.mockResolvedValue([]);
      generateAndPersistTrainingPlan.mockRejectedValue(new Error("Gemini error"));

      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({
            title: "Maratón",
            goalType: "marathon",
            targetDate: futureDate(),
          }),
          headers: { "Content-Type": "application/json", "X-User-Timezone": "UTC" },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Error generando el plan");
      expect(goalDelete).toHaveBeenCalledWith({ where: { id: "g-new" } });
    });

    it("returns 200 with goal and plan on success", async () => {
      getUserFromRequest.mockResolvedValue({ id: "u1" });
      const target = futureDate();
      // No duplicate
      goalFindFirst.mockResolvedValue(null);
      goalCreate.mockResolvedValue({
        id: "g-new",
        title: "10K",
        goalType: "race_10k",
      });
      // No other milestones
      goalFindMany.mockResolvedValue([]);
      generateAndPersistTrainingPlan.mockResolvedValue({ id: "plan-1", days: [] });

      const { POST } = await import("./route");
      const res = await POST(
        new NextRequest("http://localhost/api/goals", {
          method: "POST",
          body: JSON.stringify({
            title: "10K",
            goalType: "race_10k",
            targetDate: target,
          }),
          headers: { "Content-Type": "application/json", "X-User-Timezone": "Europe/Madrid" },
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.goal).toMatchObject({ id: "g-new", title: "10K" });
      expect(body.plan).toEqual({ id: "plan-1", days: [] });
      expect(generateAndPersistTrainingPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "u1",
          goalId: "g-new",
          timezone: "Europe/Madrid",
          otherMilestones: [],
        }),
      );
    });
  });
});
