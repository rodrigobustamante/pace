import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      skip,
      take: limit,
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
    }),
    prisma.activity.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
