import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { predictAllRaces } from "@pace/utils";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use last 90 days of activities for predictions
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const activities = await prisma.activity.findMany({
    where: { userId: user.id, date: { gte: since } },
    orderBy: { date: "desc" },
    select: { distanceM: true, durationSec: true },
  });

  const predictions = predictAllRaces(activities);

  return NextResponse.json({ predictions });
}
