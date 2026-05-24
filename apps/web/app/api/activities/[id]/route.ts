import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const activity = await prisma.activity.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      name: true,
      type: true,
      date: true,
      distanceM: true,
      durationSec: true,
      paceSeckm: true,
      avgHRbpm: true,
      maxHRbpm: true,
      cadenceRpm: true,
      elevationM: true,
      caloriesKcal: true,
      tss: true,
      feel: true,
      createdAt: true,
    },
  });

  if (!activity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(activity);
}
