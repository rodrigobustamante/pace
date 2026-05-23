import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

const DEBOUNCE_TTL = 23 * 60 * 60; // 23 hours — runs at most once per day per goal

function debounceKey(goalId: string) {
  return `adaptive:checked:${goalId}`;
}

/**
 * POST /api/goals/:id/check-missed
 *
 * Looks for past TrainingDays (workoutType != unknown/race) where willTrain is null
 * and no Strava activity exists for the user on that date.
 * Marks each one as willTrain = false ("missed").
 *
 * Debounced via Redis: at most once every 23 hours per goal.
 * Returns { newlyMarked, missedDays, skipped } where skipped=true means debounce is active.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: goalId } = await params;

  // Verify goal belongs to user
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id, isActive: true },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  if (!goal?.trainingPlan) {
    return Response.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  // Debounce check
  let already: string | null;
  try {
    already = await redis.get(debounceKey(goalId));
  } catch (err) {
    console.error(`[check-missed] Redis error for goalId=${goalId}:`, err);
    return Response.json({ newlyMarked: 0, missedDays: [], skipped: true });
  }
  if (already) {
    return Response.json({ newlyMarked: 0, missedDays: [], skipped: true });
  }

  const todayStr = new Date().toISOString().split("T")[0]!;

  // Past training days (non-rest, non-race) with no confirmation yet
  const unconfirmedPastDays = goal.trainingPlan.days.filter((d) => {
    const dayStr = d.date.toISOString().split("T")[0]!;
    return (
      dayStr < todayStr &&
      d.willTrain === null &&
      d.workoutType !== "unknown" &&
      d.workoutType !== "race"
    );
  });

  if (unconfirmedPastDays.length === 0) {
    // Nothing to check — still set debounce so we don't recheck every load
    await redis.setex(debounceKey(goalId), DEBOUNCE_TTL, "1");
    return Response.json({ newlyMarked: 0, missedDays: [], skipped: false });
  }

  // Fetch user's Strava activities in the date range to cross-reference
  const firstDay = unconfirmedPastDays[0]!.date;
  const lastDay = unconfirmedPastDays[unconfirmedPastDays.length - 1]!.date;

  const activities = await prisma.activity.findMany({
    where: {
      userId: user.id,
      date: { gte: firstDay, lte: new Date(lastDay.getTime() + 86_400_000) },
    },
    select: { date: true },
  });

  // Build a Set of date strings that have at least one activity
  const activeDates = new Set(
    activities.map((a) => a.date.toISOString().split("T")[0]!),
  );

  // Mark days with no matching activity as missed
  const toMark = unconfirmedPastDays.filter(
    (d) => !activeDates.has(d.date.toISOString().split("T")[0]!),
  );

  if (toMark.length > 0) {
    await prisma.trainingDay.updateMany({
      where: {
        id: { in: toMark.map((d) => d.id) },
        userId: user.id,
      },
      data: { willTrain: false },
    });
  }

  // Set debounce regardless of result
  await redis.setex(debounceKey(goalId), DEBOUNCE_TTL, "1");

  const missedDays = toMark.map((d) => ({
    date: d.date.toISOString().split("T")[0]!,
    title: d.title,
  }));

  console.log(
    `[check-missed] goalId=${goalId} userId=${user.id} — marked ${toMark.length} missed days`,
  );

  return Response.json({ newlyMarked: toMark.length, missedDays, skipped: false });
}
