import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getUserFromRequest } from "@/lib/auth";
import {
  buildWeeklyContext,
  formatGoalForPrompt,
} from "@/services/coach/context";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/db";
import { getModel } from "@/services/ai/registry";
import { cookies } from "next/headers";

const HISTORY_TTL = 60 * 60 * 24 * 7; // 7 days
const MAX_HISTORY_TURNS = 20; // keep last 20 message objects (10 exchanges)

/** Normalized history stored in Redis and DB — provider-agnostic. */
interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/** v2 key uses normalized format; v1 keys (Gemini-specific) are abandoned */
function historyKey(userId: string, conversationId: string) {
  return `coach:chat:v2:${userId}:${conversationId}`;
}

/** Coerce legacy "model" role (Gemini) to the normalized "assistant".
 *  "user" stays "user"; anything else ("model" or "assistant") → "assistant". */
function normalizeRole(role: string): "user" | "assistant" {
  return role === "user" ? "user" : "assistant";
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let message: string;
  let conversationId: string;
  try {
    const body = (await req.json()) as {
      message?: unknown;
      conversationId?: unknown;
    };
    message = typeof body.message === "string" ? body.message.trim() : "";
    conversationId =
      typeof body.conversationId === "string" ? body.conversationId : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!message || !conversationId) {
    return new Response(
      JSON.stringify({ error: "message and conversationId required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // ── Load history: Redis first, DB on cache miss ────────────────────────
  const key = historyKey(user.id, conversationId);
  const raw = await redis.get(key);
  let history: HistoryMessage[] = [];

  if (raw) {
    history = JSON.parse(raw) as HistoryMessage[];
  } else {
    const dbMessages = await prisma.coachChat.findMany({
      where: { userId: user.id, conversationId },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_TURNS,
      select: { role: true, content: true },
    });
    if (dbMessages.length > 0) {
      history = dbMessages.map((m) => ({
        role: normalizeRole(m.role),
        content: m.content,
      }));
      await redis.setex(key, HISTORY_TTL, JSON.stringify(history));
    }
  }

  // ── Build system prompt ───────────────────────────────────────────────
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "es";
  const tz = req.headers.get("X-User-Timezone") ?? "UTC";
  const ctx = await buildWeeklyContext(user.id, tz);

  const goalBlock = formatGoalForPrompt(ctx.goal);
  const langInstruction =
    locale === "en" ? "Always respond in English." : "Siempre responde en español.";
  const riskLine =
    ctx.overttrainingRisk.level !== "ok"
      ? `⚠️ Overtraining signals (${ctx.overttrainingRisk.level}): ${ctx.overttrainingRisk.signals.join(" · ")}`
      : "No overtraining signals.";

  const systemInstruction = `You are the personal running coach of ${ctx.userName}. You have full access to their training data.
Answer specific questions about their training, performance, recovery, and improvement.
Be direct, concrete, and use the athlete's real data in your responses. ${langInstruction}
If something is not in the available data, say so clearly without making things up.

Current athlete data:
- Max HR: ${ctx.maxHR ?? "not set"} bpm | Threshold HR: ${ctx.thresholdHR} bpm
- Zones: ${ctx.zoneRanges}
- Current form — CTL: ${ctx.ctl} | ATL: ${ctx.atl} | TSB: ${ctx.tsb} (${ctx.tsbTrend})
- This week (${ctx.weekStart} → ${ctx.weekEnd}): ${ctx.weeklyKm.toFixed(1)} km, ${ctx.activitiesCount} sessions, TSS ${ctx.weeklyTSS}
- Avg pace: ${ctx.avgPaceFormatted} min/km | Avg HR: ${ctx.avgHR} bpm
- Previous week: ${ctx.prevWeekKm.toFixed(1)} km, TSS ${ctx.prevWeekTSS} (${ctx.volumeChangePct > 0 ? "+" : ""}${ctx.volumeChangePct}% volume)
- Zone distribution (90 days): ${ctx.zoneDistribution}
- Last 3 activities:
${ctx.recentActivities.map((a) => `  · ${a.date}: ${a.name} — ${a.km}km @ ${a.pace}/km, HR ${a.avgHR ?? "—"}bpm`).join("\n")}
- ${riskLine}

${goalBlock}`;

  // ── Select model (user preference → fallback) ─────────────────────────
  const { model } = getModel(user.preferredModel);

  // ── Stream response ───────────────────────────────────────────────────
  const messages = [
    ...history,
    { role: "user" as const, content: message },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullResponse = "";

      try {
        const result = streamText({
          model,
          system: systemInstruction,
          messages,
          temperature: 0.5,
        });

        for await (const chunk of result.textStream) {
          if (chunk) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        // Write-through: persist both turns to DB
        await prisma.coachChat.createMany({
          data: [
            { userId: user.id, conversationId, role: "user", content: message },
            { userId: user.id, conversationId, role: "assistant", content: fullResponse },
          ],
        });

        // Update Redis with new history (trim to MAX_HISTORY_TURNS)
        const newHistory: HistoryMessage[] = [
          ...history,
          { role: "user" as const, content: message },
          { role: "assistant" as const, content: fullResponse },
        ].slice(-MAX_HISTORY_TURNS);

        await redis.setex(key, HISTORY_TTL, JSON.stringify(newHistory));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
