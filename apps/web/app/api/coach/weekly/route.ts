import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import { buildWeeklyContext, formatGoalForPrompt, localDateStr } from "@/services/coach/context";
import { redis } from "@/lib/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const COACH_SYSTEM_PROMPT = `You are an expert, personalized running coach in the style of Runna.
You analyze real athlete data and give concrete, personalized, actionable advice.
Avoid generalities. Be direct and specific.
The athlete is a serious recreational runner who trains with data and wants to improve consistently.
Always respond in Spanish.
Respond ONLY in valid JSON with this exact structure, no extra text:
{
  "summary": "string — 2-3 sentences on current status",
  "positive": { "title": "string", "body": "string" },
  "warning":  { "title": "string", "body": "string" },
  "tip":      { "title": "string", "body": "string" },
  "prediction":{ "title": "string", "body": "string" },
  "complementary": { "title": "string", "body": "string" }
}
The "complementary" field must prescribe a concrete strength training session targeting the primary running muscle groups: glutes, hamstrings, quads, calves, hip flexors, and core. Goal is hypertrophy and injury prevention, not cardio.
Rules:
- Always recommend strength work (never yoga, swimming, or cycling as the main recommendation)
- Prescribe 4–6 exercises with exact sets × reps (e.g. "4×10 hip thrust con peso", "3×12 sentadilla búlgara por pierna")
- Adjust volume/intensity to fatigue: TSB < -15 → 2–3 sets per exercise, lighter; TSB > 0 → 4–5 sets, progressive overload
- Race proximity: < 14 days to race → skip heavy compound lifts, prescribe only bodyweight activation (glute bridges, clamshells, single-leg RDL sin peso); > 14 days → full weighted session allowed
- Specify the best day to do it relative to runs (e.g. "el miércoles, al menos 6h después del rodaje" or "el día de descanso")
- Focus on unilateral exercises (single-leg) to correct asymmetries common in runners
- Keep the body field concise: list the exercises directly, one per line or separated by "·"`;

/** Extracts the first valid JSON object from a Gemini response. */
function extractJSON(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON found. Preview: ${raw.slice(0, 300)}`);
  }
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

/** Cache key = Monday of the user's current local week */
function getWeekKey(tz: string): string {
  const todayStr = localDateStr(tz);
  const [y, m, d] = todayStr.split("-").map(Number);
  const jsDay = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  return new Date(Date.UTC(y!, m! - 1, d! + offset)).toISOString().split("T")[0]!;
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive",
  "X-Content-Type-Options": "nosniff",
} as const;

/** Encode a single SSE event as a UTF-8 string (safe as Response body). */
function sseText(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

/** Encode a single SSE event as bytes for use inside a ReadableStream controller. */
function encode(payload: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(sseText(payload));
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tz = req.headers.get("X-User-Timezone") ?? "UTC";
  const cacheKey = `coach:weekly:${user.id}:${getWeekKey(tz)}`;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  if (refresh) {
    await redis.del(cacheKey);
  } else {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // Cache hit — single done event, no streaming needed
      return new Response(
        sseText({ type: "done", result: JSON.parse(cached) as Record<string, unknown> }),
        { headers: SSE_HEADERS },
      );
    }
  }

  // Build context before opening the stream so errors return cleanly
  let context: Awaited<ReturnType<typeof buildWeeklyContext>>;
  try {
    context = await buildWeeklyContext(user.id, tz);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Weekly context error:", msg);
    return new Response(sseText({ type: "error", message: "Coach no disponible. Intenta de nuevo." }), {
      headers: SSE_HEADERS,
    });
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: COACH_SYSTEM_PROMPT,
    generationConfig: { temperature: 0.4 },
  });

  const goalBlock = formatGoalForPrompt(context.goal);

  const riskBlock =
    context.overttrainingRisk.level !== "ok"
      ? `⚠️ Overtraining signals detected (${context.overttrainingRisk.level}): ${context.overttrainingRisk.signals.join(" · ")}`
      : "No overtraining signals.";

  const recoveryBlock = context.longRunRecovery
    ? (() => {
        const lr = context.longRunRecovery;
        const days =
          lr.recoveryDays.length > 0
            ? lr.recoveryDays
                .map(
                  (d) =>
                    `  Day+${d.daysAfter}: ${d.km}km @ ${d.pace}/km, HR ${d.avgHR ?? "—"}bpm, TSS ${d.tss ?? "—"}`,
                )
                .join("\n")
            : "  No activities logged yet in recovery window";
        return `Last long run: ${lr.longRunKm}km on ${lr.longRunDate} (${lr.daysSinceLongRun} days ago)\nRecovery activities (7-day window):\n${days}`;
      })()
    : "No long run in the last 30 days.";

  const prompt = `Athlete: ${context.userName}
Max HR: ${context.maxHR ?? "not set"} bpm | Threshold HR: ${context.thresholdHR} bpm

HR Zones (5-zone model):
${context.zoneRanges}

Current form:
- CTL (Fitness): ${context.ctl} | ATL (Fatigue): ${context.atl} | TSB (Form): ${context.tsb}${context.tsb < -10 ? " ⚠️" : context.tsb > 5 ? " ✓" : ""}
- Trend: ${context.tsbTrend}

This week (${context.weekStart} to ${context.weekEnd}):
- Total km: ${context.weeklyKm.toFixed(1)} | Sessions: ${context.activitiesCount} | TSS: ${context.weeklyTSS}
- Avg pace: ${context.avgPaceFormatted} min/km | Avg HR: ${context.avgHR} bpm
- Zone distribution (last 90 days): ${context.zoneDistribution}

Previous week: ${context.prevWeekKm.toFixed(1)} km, TSS ${context.prevWeekTSS} (volume change: ${context.volumeChangePct > 0 ? "+" : ""}${context.volumeChangePct}%)

Last 3 activities:
${context.recentActivities.map((a) => `- ${a.date}: ${a.name} — ${a.km}km @ ${a.pace}/km, HR ${a.avgHR ?? "—"}bpm`).join("\n")}

Overtraining signals:
${riskBlock}

Post-long-run recovery:
${recoveryBlock}

Training goal & plan:
${goalBlock}

Generate the weekly analysis in JSON. If there is an active goal, the analysis must reference it explicitly — evaluate whether the week's training is aligned with the race preparation, comment on the upcoming plan, and adjust recommendations accordingly. If overtraining signals are detected, the warning card MUST address them directly.`;

  const body = new ReadableStream({
    async start(controller) {
      let fullText = "";
      try {
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            controller.enqueue(encode({ type: "chunk", text }));
          }
        }

        const parsed = extractJSON(fullText);
        await redis.setex(cacheKey, 86400, JSON.stringify(parsed));
        controller.enqueue(encode({ type: "done", result: parsed }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Gemini weekly stream error:", msg);
        controller.enqueue(encode({ type: "error", message: "Coach no disponible. Intenta de nuevo." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, { headers: SSE_HEADERS });
}
