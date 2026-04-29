import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import {
  buildWeeklyContext,
  formatGoalForPrompt,
} from "@/services/coach/context";
import { redis } from "@/lib/redis";
import { cookies } from "next/headers";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const HISTORY_TTL = 60 * 60 * 24 * 7; // 7 days
const MAX_HISTORY_TURNS = 20; // keep last 20 turns (10 exchanges)

type GeminiRole = "user" | "model";
interface HistoryTurn {
  role: GeminiRole;
  parts: { text: string }[];
}

function historyKey(userId: string, conversationId: string) {
  return `coach:chat:${userId}:${conversationId}`;
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

  // Load history from Redis
  const key = historyKey(user.id, conversationId);
  const raw = await redis.get(key);
  const history: HistoryTurn[] = raw ? (JSON.parse(raw) as HistoryTurn[]) : [];

  // Build system prompt with athlete context
  const locale = cookies().get("NEXT_LOCALE")?.value ?? "es";
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

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: { temperature: 0.5 },
  });

  const chat = model.startChat({ history });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullResponse = "";

      try {
        const result = await chat.sendMessageStream(message);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }

        // Persist updated history (trim to MAX_HISTORY_TURNS)
        const newHistory: HistoryTurn[] = [
          ...history,
          { role: "user" as const, parts: [{ text: message }] },
          { role: "model" as const, parts: [{ text: fullResponse }] },
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
