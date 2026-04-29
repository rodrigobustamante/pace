import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserFromRequest = vi.fn();
const buildWeeklyContext = vi.fn();
const formatGoalForPrompt = vi.fn();
const redisGet = vi.fn();
const redisSetex = vi.fn();
const sendMessageStream = vi.fn();
const startChat = vi.fn();
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
  buildWeeklyContext,
  formatGoalForPrompt,
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    get: redisGet,
    setex: redisSetex,
  },
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = getGenerativeModel;
  },
}));

describe("POST /api/coach/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getGenerativeModel.mockReturnValue({
      startChat,
    });

    startChat.mockReturnValue({
      sendMessageStream,
    });

    formatGoalForPrompt.mockReturnValue("Goal block");
    buildWeeklyContext.mockResolvedValue({
      userName: "Rod",
      maxHR: 190,
      thresholdHR: 169,
      zoneRanges: "Z1<114 Z2<133 Z3<152 Z4<171 Z5>=171",
      ctl: 55,
      atl: 61,
      tsb: -6,
      tsbTrend: "stable",
      weekStart: "2026-04-21",
      weekEnd: "2026-04-27",
      weeklyKm: 42.2,
      activitiesCount: 4,
      weeklyTSS: 280,
      avgPaceFormatted: "5:05",
      avgHR: 151,
      prevWeekKm: 39.8,
      prevWeekTSS: 260,
      volumeChangePct: 6,
      zoneDistribution: "Z1:30 Z2:120 Z3:40 Z4:20 Z5:5",
      recentActivities: [
        { date: "2026-04-24", name: "Tempo", km: 8, pace: "4:50", avgHR: 164 },
      ],
      overttrainingRisk: {
        level: "ok",
        signals: [],
      },
      goal: null,
    });
  });

  it("returns 401 when user is missing", async () => {
    getUserFromRequest.mockResolvedValue(null);
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: "hola", conversationId: "abc" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req as never);
    expect(response.status).toBe(401);
  });

  it("returns 400 when body is invalid", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: "invalid-json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req as never);
    expect(response.status).toBe(400);
  });

  it("streams model response and persists history", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    redisGet.mockResolvedValue(JSON.stringify([]));
    sendMessageStream.mockResolvedValue({
      stream: (async function* streamChunks() {
        yield { text: () => "Hola" };
        yield { text: () => " runner" };
      })(),
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Que recomiendas hoy?", conversationId: "c1" }),
      headers: {
        "Content-Type": "application/json",
        "X-User-Timezone": "Europe/Madrid",
      },
    });

    const response = await POST(req as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toBe("Hola runner");
    expect(buildWeeklyContext).toHaveBeenCalledWith("u1", "Europe/Madrid");
    expect(redisSetex).toHaveBeenCalledTimes(1);
    expect(startChat).toHaveBeenCalledWith({ history: [] });
  });

  it("returns 400 when required fields are missing", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: "   ", conversationId: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req as never);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain("message and conversationId required");
  });

  it("uses existing redis history and handles empty stream chunks", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    redisGet.mockResolvedValue(
      JSON.stringify([{ role: "user", parts: [{ text: "prev question" }] }]),
    );
    sendMessageStream.mockResolvedValue({
      stream: (async function* streamChunks() {
        yield { text: () => "" };
        yield { text: () => "Nueva respuesta" };
      })(),
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Sigue", conversationId: "c1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req as never);
    const text = await response.text();
    expect(text).toBe("Nueva respuesta");
    expect(startChat).toHaveBeenCalledWith({
      history: [{ role: "user", parts: [{ text: "prev question" }] }],
    });
  });

  it("builds risk line when overtraining signals are present", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    buildWeeklyContext.mockResolvedValue({
      userName: "Rod",
      maxHR: 190,
      thresholdHR: 169,
      zoneRanges: "Z1<114 Z2<133 Z3<152 Z4<171 Z5>=171",
      ctl: 48,
      atl: 66,
      tsb: -18,
      tsbTrend: "declining",
      weekStart: "2026-04-21",
      weekEnd: "2026-04-27",
      weeklyKm: 55.4,
      activitiesCount: 6,
      weeklyTSS: 410,
      avgPaceFormatted: "4:58",
      avgHR: 159,
      prevWeekKm: 42.1,
      prevWeekTSS: 320,
      volumeChangePct: 32,
      zoneDistribution: "Z1:20 Z2:90 Z3:70 Z4:40 Z5:20",
      recentActivities: [
        { date: "2026-04-24", name: "Series", km: 11, pace: "4:35", avgHR: 171 },
      ],
      overttrainingRisk: {
        level: "warning",
        signals: ["TSB bajo", "carga aguda alta"],
      },
      goal: null,
    });
    sendMessageStream.mockResolvedValue({
      stream: (async function* streamChunks() {
        yield { text: () => "ok" };
      })(),
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Como voy?", conversationId: "c2" }),
      headers: { "Content-Type": "application/json" },
    });

    await POST(req as never);
    const modelConfig = getGenerativeModel.mock.calls[0]?.[0] as {
      systemInstruction: string;
    };
    expect(modelConfig.systemInstruction).toContain(
      "Overtraining signals (warning)",
    );
  });

  it("streams error marker when provider throws", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1" });
    redisGet.mockResolvedValue(null);
    sendMessageStream.mockRejectedValue(new Error("Gemini down"));

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Hola", conversationId: "c1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req as never);
    const text = await response.text();
    expect(text).toContain("[Error: Gemini down]");
  });
});
