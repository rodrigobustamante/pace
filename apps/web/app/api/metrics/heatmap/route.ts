import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

interface HeatmapDay {
  date: string;
  km: number;
  tss: number;
  count: number;
}

interface HeatmapResponse {
  days: HeatmapDay[];
  maxKm: number;
  maxTSS: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0]!;
  const cacheKey = `metrics:heatmap:${user.id}:${today}`;
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  if (refresh) {
    await redis.del(cacheKey);
  } else {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached) as HeatmapResponse);
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - 364); // 365 days inclusive of today

  const activities = await prisma.activity.findMany({
    where: {
      userId: user.id,
      date: { gte: since },
    },
    select: {
      date: true,
      distanceM: true,
      tss: true,
    },
    orderBy: { date: "asc" },
  });

  // Aggregate by date
  const dayMap = new Map<string, { km: number; tss: number; count: number }>();

  for (const act of activities) {
    const dateKey = act.date.toISOString().split("T")[0]!;
    const existing = dayMap.get(dateKey) ?? { km: 0, tss: 0, count: 0 };
    dayMap.set(dateKey, {
      km: existing.km + act.distanceM / 1000,
      tss: existing.tss + (act.tss ?? 0),
      count: existing.count + 1,
    });
  }

  const days: HeatmapDay[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      km: Math.round(data.km * 10) / 10,
      tss: Math.round(data.tss),
      count: data.count,
    }));

  const maxKm = days.reduce((max, d) => Math.max(max, d.km), 0);
  const maxTSS = days.reduce((max, d) => Math.max(max, d.tss), 0);

  const response: HeatmapResponse = { days, maxKm, maxTSS };

  await redis.setex(cacheKey, 6 * 3600, JSON.stringify(response));

  return NextResponse.json(response);
}
