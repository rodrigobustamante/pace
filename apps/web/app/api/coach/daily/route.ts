import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import {
  buildDailyContext,
  formatGoalForPrompt,
  localDateStr,
  secsUntilLocalMidnight,
} from "@/services/coach/context";
import { redis } from "@/lib/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DAILY_SYSTEM_PROMPT = `You are an expert running coach advising a serious recreational runner.
The athlete has an active training plan. Your job is to evaluate whether TODAY's planned session should be executed as-is, adjusted, or replaced with rest — based on their current physiological state.

Decision hierarchy (apply in order):
1. If the plan prescribes rest today (workoutType "unknown") → always recommend rest.
2. If the plan prescribes a workout today → follow it UNLESS one of these hard stops applies:
   a. TSB < -20 (severe accumulated fatigue) → replace with easy session or rest.
   b. Consecutive run days ≥ 5 → force a rest day.
   c. ATL is more than 2× CTL → overreaching risk, recommend rest.
3. Mild fatigue (TSB between -5 and -20) is NORMAL in a training block — do NOT use it alone to override the plan. Instead, suggest adjusting intensity within the planned session type.
4. If no plan exists, base the recommendation purely on the physiological data.

Be direct and concrete. Reference actual numbers. Avoid generalities. Always respond in Spanish.
Respond ONLY in valid JSON with this exact structure, no extra text:
{
  "recommendation": "train" | "rest",
  "sessionType": "easy" | "tempo" | "long" | "workout" | null,
  "title": "string — short headline, e.g. 'Entrena suave hoy' or 'Día de reposo recomendado'",
  "body": "string — 2-3 sentences explaining the recommendation with specific data from the athlete",
  "duration": "string | null — e.g. '40-50 min' only when recommendation is train",
  "intensity": "string | null — e.g. 'Z2, FC < 145 bpm' only when recommendation is train"
}
sessionType, duration, and intensity must be null when recommendation is 'rest'.`;

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tz    = req.headers.get("X-User-Timezone") ?? "UTC";
  const today = localDateStr(tz);
  const cacheKey = `coach:daily:${user.id}:${today}`;
  const refresh  = req.nextUrl.searchParams.get("refresh") === "1";

  if (refresh) {
    await redis.del(cacheKey);
  } else {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  }

  try {
    const ctx = await buildDailyContext(user.id, tz);

    const lastActLines = ctx.lastActivity
      ? `- Last run: ${ctx.lastActivity.name} (${ctx.lastActivity.daysAgo === 0 ? "today" : ctx.lastActivity.daysAgo === 1 ? "yesterday" : `${ctx.lastActivity.daysAgo} days ago`}) — ${ctx.lastActivity.km}km @ ${ctx.lastActivity.pace}/km, HR ${ctx.lastActivity.avgHR ?? "—"}bpm, TSS ${ctx.lastActivity.tss ?? "—"}`
      : "- No recent activities";

    const goalBlock = formatGoalForPrompt(ctx.goal);
    const riskBlock =
      ctx.overttrainingRisk.level !== "ok"
        ? `⚠️ Overtraining signals (${ctx.overttrainingRisk.level}): ${ctx.overttrainingRisk.signals.join(" · ")}`
        : "No overtraining signals.";

    const prompt = `Athlete: ${ctx.userName}
Max HR: ${ctx.maxHR ?? "not set"} bpm | Threshold HR: ${ctx.thresholdHR} bpm
Today: ${ctx.dayOfWeek}, ${ctx.todayDate}

Current form:
- CTL (Fitness): ${ctx.ctl} | ATL (Fatigue): ${ctx.atl} | TSB (Form): ${ctx.tsb} (${ctx.tsbTrend})

This week so far:
- Sessions: ${ctx.weekSessionsCount} | Volume: ${ctx.weeklyKm.toFixed(1)} km | TSS: ${ctx.weeklyTSS}
- Types: ${ctx.weekSessionTypes}

Recent load:
${lastActLines}
- Consecutive run days before today: ${ctx.consecutiveRunDays}
- Days since last run: ${ctx.daysSinceLastRun === 0 ? "ran today already" : ctx.daysSinceLastRun}

Overtraining signals:
${riskBlock}

Training goal & plan:
${goalBlock}

Generate the daily recommendation in JSON following the decision hierarchy in your instructions.
If a planned workout exists for today, it is the default — deviate from it only if the hard-stop criteria are met (TSB < -20, consecutive days ≥ 5, or ATL > 2× CTL). Cite the specific numbers that justify your decision.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: DAILY_SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.35,
      },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Cache until end of the user's local day
    const ttl = secsUntilLocalMidnight(tz);
    await redis.setex(cacheKey, ttl, JSON.stringify(parsed));

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gemini daily coach error:", msg);
    return NextResponse.json(
      { error: "Coach no disponible. Intenta de nuevo.", detail: msg },
      { status: 500 },
    );
  }
}
