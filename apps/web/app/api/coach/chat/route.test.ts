import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const getUserFromRequest = vi.fn();
const buildWeeklyContext = vi.fn();
const formatGoalForPrompt = vi.fn();
const redisGet = vi.fn();
const redisSetex = vi.fn();
const coachChatCreateMany = vi.fn();
const coachChatFindMany = vi.fn();
const streamTextMock = vi.fn();
const getModelMock = vi.fn();

vi.mock("@/lib/auth", () => ({ getUserFromRequest }));

vi.mock("next/headers", () => ({
  cookies: () => ({ get: (n: string) => (n === "NEXT_LOCALE" ? { value: "es" } : undefined) }),
}));

vi.mock("@/services/coach/context", () => ({
  buildWeeklyContext,
  formatGoalForPrompt,
}));

vi.mock("@/lib/redis", () => ({
  redis: { get: redisGet, setex: redisSetex },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    coachChat: {
      createMany: coachChatCreateMany,
      findMany: coachChatFindMany,
    },
  },
}));

vi.mock("ai", () => ({ streamText: streamTextMock }));

vi.mock("@/services/ai/registry", () => ({
  getModel: getModelMock,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTextStream(...chunks: string[]) {
  return (async function* () {
    for (const c of chunks) yield c;
  })();
}

const MOCK_CTX = {
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
  overttrainingRisk: { level: "ok", signals: [] },
  goal: null,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/coach/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    getModelMock.mockReturnValue({
      model: { /* opaque LanguageModel */ },
      info: { id: "gemini-2.5-flash", provider: "gemini", available: true },
    });
    streamTextMock.mockReturnValue({ textStream: makeTextStream("Hola", " runner") });
    formatGoalForPrompt.mockReturnValue("Goal block");
    coachChatCreateMany.mockResolvedValue({ count: 2 });
    coachChatFindMany.mockResolvedValue([]);
    buildWeeklyContext.mockResolvedValue(MOCK_CTX);
  });

  it("returns 401 when user is missing", async () => {
    getUserFromRequest.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ message: "hola", conversationId: "abc" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when body is invalid JSON", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/coach/chat", {
        method: "POST",
        body: "invalid-json",
        headers: { "Content-Type": "application/json" },
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ message: "   ", conversationId: "" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("message and conversationId required");
  });

  it("streams model response, persists to DB, and updates Redis", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    redisGet.mockResolvedValue(JSON.stringify([]));

    const { POST } = await import("./route");
    const res = await POST(
      makeRequest({ message: "Que recomiendas hoy?", conversationId: "c1" }, {
        "X-User-Timezone": "Europe/Madrid",
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");

    const text = await res.text();
    expect(text).toBe("Hola runner");
    expect(buildWeeklyContext).toHaveBeenCalledWith("u1", "Europe/Madrid");

    // DB write-through with normalized "assistant" role
    expect(coachChatCreateMany).toHaveBeenCalledWith({
      data: [
        { userId: "u1", conversationId: "c1", role: "user", content: "Que recomiendas hoy?" },
        { userId: "u1", conversationId: "c1", role: "assistant", content: "Hola runner" },
      ],
    });

    // Redis updated
    expect(redisSetex).toHaveBeenCalledTimes(1);
    const [savedKey, , savedPayload] = redisSetex.mock.calls[0]!;
    expect(savedKey).toContain("v2:");
    const saved = JSON.parse(savedPayload as string) as Array<{ role: string }>;
    expect(saved.at(-1)?.role).toBe("assistant");
  });

  it("loads history from DB when Redis misses (v2 key), warms cache, then persists", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    redisGet.mockResolvedValue(null);
    coachChatFindMany.mockResolvedValue([
      { role: "user", content: "prev question" },
      { role: "assistant", content: "prev answer" },
    ]);
    streamTextMock.mockReturnValue({ textStream: makeTextStream("Respuesta nueva") });

    const { POST } = await import("./route");
    const res = await POST(makeRequest({ message: "Sigue", conversationId: "c-db" }));
    const text = await res.text();
    expect(text).toBe("Respuesta nueva");

    // DB was queried for history
    expect(coachChatFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", conversationId: "c-db" } }),
    );

    // Redis was warmed (cache miss → warm) then updated after stream → 2 calls
    expect(redisSetex).toHaveBeenCalledTimes(2);

    // streamText received the DB history
    const callArgs = streamTextMock.mock.calls[0]![0] as { messages: Array<{ role: string }> };
    expect(callArgs.messages[0]?.role).toBe("user");
    expect(callArgs.messages[1]?.role).toBe("assistant");
  });

  it("does not call DB when Redis has history", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    redisGet.mockResolvedValue(
      JSON.stringify([{ role: "user", content: "prev" }, { role: "assistant", content: "ans" }]),
    );

    const { POST } = await import("./route");
    await (await POST(makeRequest({ message: "Sigue", conversationId: "c1" }))).text();

    expect(coachChatFindMany).not.toHaveBeenCalled();
  });

  it("builds overtraining risk line when signals are present", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    buildWeeklyContext.mockResolvedValue({
      ...MOCK_CTX,
      overttrainingRisk: { level: "warning", signals: ["TSB bajo", "carga alta"] },
    });
    redisGet.mockResolvedValue(null);

    const { POST } = await import("./route");
    await (await POST(makeRequest({ message: "Como voy?", conversationId: "c2" }))).text();

    const callArgs = streamTextMock.mock.calls[0]![0] as { system: string };
    expect(callArgs.system).toContain("Overtraining signals (warning)");
  });

  it("streams error marker when provider throws, does not persist to DB", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gemini-2.5-flash" });
    redisGet.mockResolvedValue(null);
    streamTextMock.mockReturnValue({
      textStream: (async function* () {
        throw new Error("AI down");
      })(),
    });

    const { POST } = await import("./route");
    const res = await POST(makeRequest({ message: "Hola", conversationId: "c1" }));
    const text = await res.text();

    expect(text).toContain("[Error: AI down]");
    expect(coachChatCreateMany).not.toHaveBeenCalled();
  });

  it("uses user preferredModel to select provider", async () => {
    getUserFromRequest.mockResolvedValue({ id: "u1", preferredModel: "gpt-4o" });
    redisGet.mockResolvedValue(null);

    const { POST } = await import("./route");
    await (await POST(makeRequest({ message: "Hola", conversationId: "c1" }))).text();

    expect(getModelMock).toHaveBeenCalledWith("gpt-4o");
  });
});

// ── Utility ──────────────────────────────────────────────────────────────────

function makeRequest(
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/coach/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...extraHeaders },
  }) as never;
}
