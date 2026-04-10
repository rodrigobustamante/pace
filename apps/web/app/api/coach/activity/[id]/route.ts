import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import {
  secToPace,
  mToKm,
  secToDuration,
  estimateThresholdHR,
  calculateRunTSS,
} from "@pace/utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const ACTIVITY_COACH_SYSTEM_PROMPT = `You are an expert running coach analyzing a single training session.
Give concrete, data-driven feedback on the quality and execution of this specific run.
Be direct, specific, and actionable. Always respond in Spanish.
Respond ONLY in valid JSON with this exact structure, no extra text:
{
  "verdict": "string — one sentence overall assessment of this run",
  "effort": { "title": "string", "body": "string — analysis of effort/intensity level" },
  "execution": { "title": "string", "body": "string — pacing, HR distribution, cadence observations" },
  "recovery": { "title": "string", "body": "string — how long to recover and what to do next" },
  "tip": { "title": "string", "body": "string — one concrete improvement for next similar session" }
}`;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activity = await prisma.activity.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cacheKey = `coach:activity:${activity.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const thresholdHR = user.maxHR ? estimateThresholdHR(user.maxHR) : 160;
  const tss =
    activity.tss ??
    (activity.avgHRbpm
      ? calculateRunTSS(activity.durationSec, activity.avgHRbpm, thresholdHR)
      : null);

  const hrZoneLabel =
    activity.avgHRbpm && user.maxHR
      ? (() => {
          const pct = (activity.avgHRbpm / user.maxHR) * 100;
          if (pct < 60) return "Z1 (recuperación)";
          if (pct < 70) return "Z2 (aeróbico base)";
          if (pct < 80) return "Z3 (umbral aeróbico)";
          if (pct < 90) return "Z4 (umbral anaeróbico)";
          return "Z5 (VO2max)";
        })()
      : "zona desconocida";

  const prompt = `Analyze this training session:

Activity: ${activity.name}
Type: ${activity.type}
Date: ${activity.date.toISOString().split("T")[0]}

Performance:
- Distance: ${mToKm(activity.distanceM)} km
- Duration: ${secToDuration(activity.durationSec)}
- Avg pace: ${secToPace(activity.paceSeckm)} min/km
- Avg HR: ${activity.avgHRbpm ?? "—"} bpm (${hrZoneLabel})
- Max HR: ${activity.maxHRbpm ?? "—"} bpm
- Cadence: ${activity.cadenceRpm ?? "—"} spm
- Elevation: ${activity.elevationM != null ? `+${Math.round(activity.elevationM)}m` : "—"}
- Calories: ${activity.caloriesKcal ?? "—"} kcal
- TSS: ${tss != null ? Math.round(tss) : "—"}
- Athlete max HR: ${user.maxHR ?? "not set"} bpm | Threshold HR: ${thresholdHR} bpm

Generate the activity analysis in JSON.`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: ACTIVITY_COACH_SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.35,
    },
  });

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(start, end + 1));

    // Cache 24h — activity data doesn't change
    await redis.setex(cacheKey, 86400, JSON.stringify(parsed));

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Gemini activity analysis error:", err);
    return NextResponse.json(
      { error: "Coach no disponible" },
      { status: 500 },
    );
  }
}
