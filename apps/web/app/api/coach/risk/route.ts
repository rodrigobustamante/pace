import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { buildDailyContext, localDateStr } from "@/services/coach/context";
import { redis } from "@/lib/redis";

/**
 * GET /api/coach/risk
 *
 * Returns overtraining risk signals and race-day form projection.
 * Purely algorithmic — no Gemini involved.
 * Cached 1 hour per user per day.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tz = req.headers.get("X-User-Timezone") ?? "UTC";
  const today = localDateStr(tz);
  const cacheKey = `coach:risk:${user.id}:${today}`;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  if (!refresh) {
    const cached = await redis.get(cacheKey);
    if (cached) return NextResponse.json(JSON.parse(cached));
  }

  try {
    // buildDailyContext already computes overttrainingRisk and goal.raceProjection
    const ctx = await buildDailyContext(user.id, tz);

    const result = {
      overttrainingRisk: ctx.overttrainingRisk,
      raceProjection: ctx.goal.hasGoal
        ? {
            goalTitle: ctx.goal.goalTitle,
            targetDate: ctx.goal.targetDate,
            daysUntilRace: ctx.goal.daysUntilRace,
            projection: ctx.goal.raceProjection,
          }
        : null,
    };

    await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1h
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("coach/risk error:", msg);
    return NextResponse.json({ error: "Error calculando señales.", detail: msg }, { status: 500 });
  }
}
