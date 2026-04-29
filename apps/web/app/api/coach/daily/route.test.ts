import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserFromRequest = vi.fn();
const buildDailyContext = vi.fn();
const formatGoalForPrompt = vi.fn();
const localDateStr = vi.fn();
const secsUntilLocalMidnight = vi.fn();
const redisGet = vi.fn();
const redisDel = vi.fn();
const redisSetex = vi.fn();
const generateContent = vi.fn();
const getGenerativeModel = vi.fn();

vi.mock("@/lib/auth", () => ({
  getUserFromRequest,
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) =>
      name === "NEXT_LOCALE" ? { value: "es" } : undefined,
  }),
}));

vi.mock("@/services/coach/context", () => ({
  buildDailyContext,
  formatGoalForPrompt,
  localDateStr,
  secsUntilLocalMidnight,
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: redisGet,
    del: redisDel,
    setex: redisSetex,
  },
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = getGenerativeModel;
  },
}));

describe("GET /api/coach/daily", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    generateContent.mockReset();
    redisGet.mockResolvedValue(null);

    getGenerativeModel.mockReturnValue({
      generateContent,
    });
    localDateStr.mockReturnValue("2026-04-25");
    secsUntilLocalMidnight.mockReturnValue(3600);
    formatGoalForPrompt.mockReturnValue("Goal prompt");
    buildDailyContext.mockResolvedValue({
      userName: "Rod",
      maxHR: 190,
      thresholdHR: 169,
      dayOfWeek: "Saturday",
      todayDate: "2026-04-25",
      ctl: 52,
      atl: 57,
      tsb: -5,
      tsbTrend: "stable",
      weekSessionsCount: 3,
      weeklyKm: 31.4,
      weeklyTSS: 210,
      weekSessionTypes: "easy, tempo",
      lastActivity: null,
      consecutiveRunDays: 3,
      daysSinceLastRun: 1,
      overttrainingRisk: {
        level: "ok",
        signals: [],
      },
      goal: null,
    });
  });

  it("returns 401 for unauthorized users", async () => {
    getUserFromRequest.mockResolvedValue(null);
    const { GET } = await import("./route");

    const req = new NextRequest("http://localhost/api/coach/daily");
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it("returns cached payload when available and no refresh flag", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    redisGet.mockResolvedValue(JSON.stringify({ recommendation: "rest" }));

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/coach/daily");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ recommendation: "rest" });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("clears cache when refresh=1 and regenerates recommendation", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    generateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            recommendation: "train",
            title: "Entrena hoy",
          }),
      },
    });

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/coach/daily?refresh=1", {
      headers: { "X-User-Timezone": "Europe/Madrid" },
    });
    const response = await GET(req);
    const body = await response.json();

    expect(redisDel).toHaveBeenCalledTimes(1);
    expect(buildDailyContext).toHaveBeenCalledWith("u1", "Europe/Madrid");
    expect(redisSetex).toHaveBeenCalledWith(
      "coach:daily:u1:2026-04-25:es",
      3600,
      expect.any(String),
    );
    expect(body).toMatchObject({ recommendation: "train", title: "Entrena hoy" });
  });

  it("builds prompt with overtraining warning and same-day run context", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    buildDailyContext.mockResolvedValue({
      userName: "Rod",
      maxHR: 190,
      thresholdHR: 169,
      dayOfWeek: "Saturday",
      todayDate: "2026-04-25",
      ctl: 40,
      atl: 62,
      tsb: -22,
      tsbTrend: "declining",
      weekSessionsCount: 5,
      weeklyKm: 54.7,
      weeklyTSS: 380,
      weekSessionTypes: "easy, workout, tempo",
      lastActivity: {
        name: "Series",
        daysAgo: 0,
        km: 10.2,
        pace: "4:38",
        avgHR: 171,
        tss: 96,
      },
      consecutiveRunDays: 7,
      daysSinceLastRun: 0,
      overttrainingRisk: {
        level: "danger",
        signals: ["TSB -22", "7 días consecutivos"],
      },
      goal: { name: "10K" },
    });
    generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ recommendation: "rest" }) },
    });

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/coach/daily");
    await GET(req);

    const prompt = generateContent.mock.calls[0]?.[0] as string;
    expect(prompt).toContain("Last run: Series (today)");
    expect(prompt).toContain("Days since last run: ran today already");
    expect(prompt).toContain("Overtraining signals (danger)");
  });

  it("builds prompt labels for yesterday and older activities", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify({ recommendation: "train" }) },
    });

    const { GET } = await import("./route");

    buildDailyContext.mockResolvedValueOnce({
      userName: "Rod",
      maxHR: 190,
      thresholdHR: 169,
      dayOfWeek: "Saturday",
      todayDate: "2026-04-25",
      ctl: 52,
      atl: 57,
      tsb: -5,
      tsbTrend: "stable",
      weekSessionsCount: 3,
      weeklyKm: 31.4,
      weeklyTSS: 210,
      weekSessionTypes: "easy, tempo",
      lastActivity: {
        name: "Easy run",
        daysAgo: 1,
        km: 6.5,
        pace: "5:20",
        avgHR: 145,
        tss: 42,
      },
      consecutiveRunDays: 3,
      daysSinceLastRun: 1,
      overttrainingRisk: {
        level: "ok",
        signals: [],
      },
      goal: null,
    });
    await GET(new NextRequest("http://localhost/api/coach/daily?refresh=1"));
    const yesterdayPrompt = generateContent.mock.calls[0]?.[0] as string;
    expect(yesterdayPrompt).toContain("Last run: Easy run (yesterday)");

    generateContent.mockClear();

    buildDailyContext.mockResolvedValueOnce({
      userName: "Rod",
      maxHR: 190,
      thresholdHR: 169,
      dayOfWeek: "Saturday",
      todayDate: "2026-04-25",
      ctl: 52,
      atl: 57,
      tsb: -5,
      tsbTrend: "stable",
      weekSessionsCount: 3,
      weeklyKm: 31.4,
      weeklyTSS: 210,
      weekSessionTypes: "easy, tempo",
      lastActivity: {
        name: "Long run",
        daysAgo: 4,
        km: 18,
        pace: "5:08",
        avgHR: 152,
        tss: 120,
      },
      consecutiveRunDays: 3,
      daysSinceLastRun: 4,
      overttrainingRisk: {
        level: "ok",
        signals: [],
      },
      goal: null,
    });
    await GET(new NextRequest("http://localhost/api/coach/daily?refresh=1"));
    const olderPrompt = generateContent.mock.calls[0]?.[0] as string;
    expect(olderPrompt).toContain("Last run: Long run (4 days ago)");
  });

  it("returns 500 when model call fails", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    generateContent.mockRejectedValue(new Error("Provider timeout"));

    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/coach/daily");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Coach no disponible");
  });
});
