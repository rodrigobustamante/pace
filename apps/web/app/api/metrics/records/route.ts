import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

interface PRRecord {
  distance: string;
  distanceKm: number;
  timeSec: number;
  timeFormatted: string;
  pace: string;
  date: string;
  activityName: string;
  activityId: string;
}

interface LongestRun {
  km: number;
  date: string;
  activityName: string;
  activityId: string;
}

interface RecordsResponse {
  records: Array<PRRecord | null>;
  longestRun: LongestRun | null;
}

const DISTANCE_TARGETS: Array<{
  label: string;
  minM: number;
  maxM: number;
}> = [
  { label: "5K", minM: 4400, maxM: 5600 },
  { label: "10K", minM: 9000, maxM: 11000 },
  { label: "21K", minM: 19500, maxM: 22700 },
  { label: "42K", minM: 40000, maxM: 44400 },
];

function formatTime(durationSec: number): string {
  if (durationSec < 3600) {
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  const h = Math.floor(durationSec / 3600);
  const rem = durationSec % 3600;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatPace(paceSeckm: number): string {
  const m = Math.floor(paceSeckm / 60);
  const s = paceSeckm % 60;
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cacheKey = `metrics:records:${user.id}`;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  if (refresh) {
    await redis.del(cacheKey);
  } else {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached) as RecordsResponse);
    }
  }

  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      date: true,
      distanceM: true,
      durationSec: true,
      paceSeckm: true,
    },
    orderBy: { date: "asc" },
  });

  // Find PR for each distance target
  const records: Array<PRRecord | null> = DISTANCE_TARGETS.map((target) => {
    const candidates = activities.filter(
      (a) => a.distanceM >= target.minM && a.distanceM <= target.maxM,
    );

    if (candidates.length === 0) return null;

    // Best = lowest pace (fastest)
    const best = candidates.reduce((prev, curr) =>
      curr.paceSeckm < prev.paceSeckm ? curr : prev,
    );

    return {
      distance: target.label,
      distanceKm: Math.round((best.distanceM / 1000) * 10) / 10,
      timeSec: best.durationSec,
      timeFormatted: formatTime(best.durationSec),
      pace: formatPace(best.paceSeckm),
      date: best.date.toISOString().split("T")[0]!,
      activityName: best.name,
      activityId: best.id,
    };
  });

  // Longest run
  let longestRun: LongestRun | null = null;
  if (activities.length > 0) {
    const longest = activities.reduce((prev, curr) =>
      curr.distanceM > prev.distanceM ? curr : prev,
    );
    longestRun = {
      km: Math.round((longest.distanceM / 1000) * 10) / 10,
      date: longest.date.toISOString().split("T")[0]!,
      activityName: longest.name,
      activityId: longest.id,
    };
  }

  const response: RecordsResponse = { records, longestRun };

  await redis.setex(cacheKey, 12 * 3600, JSON.stringify(response));

  return NextResponse.json(response);
}
