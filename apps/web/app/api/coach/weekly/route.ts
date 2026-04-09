import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import { buildWeeklyContext } from "@/services/coach/context";
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
  "prediction":{ "title": "string", "body": "string" }
}`;

/** Extracts the first valid JSON object from a Gemini response.
 *  Handles thinking tokens, markdown fences, and extra prose. */
function extractJSON(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON found. Preview: ${raw.slice(0, 300)}`);
  }
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

function getWeekKey(): string {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return startOfWeek.toISOString().split("T")[0]!;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cacheKey = `coach:weekly:${user.id}:${getWeekKey()}`;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  if (refresh) {
    await redis.del(cacheKey);
  } else {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  }

  try {
    const context = await buildWeeklyContext(user.id);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: COACH_SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
      },
    });

    const prompt = `Athlete: ${context.userName}
Max HR: ${context.maxHR ?? "not set"} bpm | Threshold HR: ${context.thresholdHR} bpm

Current form:
- CTL (Fitness): ${context.ctl} | ATL (Fatigue): ${context.atl} | TSB (Form): ${context.tsb}${context.tsb < -10 ? " ⚠️" : context.tsb > 5 ? " ✓" : ""}
- Trend: ${context.tsbTrend}

This week (${context.weekStart} to ${context.weekEnd}):
- Total km: ${context.weeklyKm.toFixed(1)} | Sessions: ${context.activitiesCount} | TSS: ${context.weeklyTSS}
- Avg pace: ${context.avgPaceFormatted} min/km | Avg HR: ${context.avgHR} bpm
- Zone distribution: ${context.zoneDistribution}

Previous week: ${context.prevWeekKm.toFixed(1)} km, TSS ${context.prevWeekTSS} (volume change: ${context.volumeChangePct > 0 ? "+" : ""}${context.volumeChangePct}%)

Last 3 activities:
${context.recentActivities.map((a) => `- ${a.date}: ${a.name} — ${a.km}km @ ${a.pace}/km, HR ${a.avgHR ?? "—"}bpm`).join("\n")}

Generate the weekly analysis in JSON.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = extractJSON(raw);

    await redis.setex(cacheKey, 86400, JSON.stringify(parsed));
    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gemini weekly error:", msg);
    return NextResponse.json(
      { error: "Coach no disponible. Intenta de nuevo.", detail: msg },
      { status: 500 },
    );
  }
}
