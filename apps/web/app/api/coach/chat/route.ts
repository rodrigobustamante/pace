import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import { buildWeeklyContext } from "@/services/coach/context";
import { redis } from "@/lib/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const HISTORY_TTL = 60 * 60 * 24 * 7; // 7 days
const MAX_HISTORY_TURNS = 20; // keep last 20 turns (10 exchanges)

type GeminiRole = "user" | "model";
interface HistoryTurn {
  role: GeminiRole;
  parts: [{ text: string }];
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
    const body = await req.json() as { message?: unknown; conversationId?: unknown };
    message = typeof body.message === "string" ? body.message.trim() : "";
    conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!message || !conversationId) {
    return new Response(JSON.stringify({ error: "message and conversationId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Load history from Redis
  const key = historyKey(user.id, conversationId);
  const raw = await redis.get(key);
  const history: HistoryTurn[] = raw ? (JSON.parse(raw) as HistoryTurn[]) : [];

  // Build system prompt with athlete context
  const ctx = await buildWeeklyContext(user.id);

  const systemInstruction = `Eres el coach personal de running de ${ctx.userName}. Tienes acceso completo a sus datos de entrenamiento.
Responde preguntas específicas sobre su entrenamiento, rendimiento, recuperación y mejora.
Sé directo, concreto y usa los datos reales del atleta en tus respuestas. Siempre responde en español.
Si algo no está en los datos disponibles, dilo claramente sin inventar.

Datos actuales del atleta:
- FC máxima: ${ctx.maxHR ?? "no configurada"} bpm | FC umbral: ${ctx.thresholdHR} bpm
- Zonas: ${ctx.zoneRanges}
- Forma actual — CTL: ${ctx.ctl} | ATL: ${ctx.atl} | TSB: ${ctx.tsb} (${ctx.tsbTrend})
- Esta semana (${ctx.weekStart} → ${ctx.weekEnd}): ${ctx.weeklyKm.toFixed(1)} km, ${ctx.activitiesCount} sesiones, TSS ${ctx.weeklyTSS}
- Ritmo medio: ${ctx.avgPaceFormatted} min/km | FC media: ${ctx.avgHR} bpm
- Semana anterior: ${ctx.prevWeekKm.toFixed(1)} km, TSS ${ctx.prevWeekTSS} (${ctx.volumeChangePct > 0 ? "+" : ""}${ctx.volumeChangePct}% volumen)
- Distribución de zonas (90 días): ${ctx.zoneDistribution}
- Últimas 3 actividades:
${ctx.recentActivities.map((a) => `  · ${a.date}: ${a.name} — ${a.km}km @ ${a.pace}/km, FC ${a.avgHR ?? "—"}bpm`).join("\n")}`;

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
