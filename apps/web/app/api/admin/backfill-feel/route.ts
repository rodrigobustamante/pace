import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateFeel } from "@pace/utils";

/**
 * POST /api/admin/backfill-feel
 * One-off endpoint to compute and persist feel for all existing activities
 * that have avgHRbpm but feel === null, for users that have maxHR set.
 * Only callable by the authenticated user (backfills their own activities).
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.maxHR) {
    return Response.json(
      { error: "FC máx no configurada. Configúrala en ajustes antes de ejecutar el backfill." },
      { status: 400 },
    );
  }

  const activities = await prisma.activity.findMany({
    where: {
      userId: user.id,
      feel: null,
      avgHRbpm: { not: null },
    },
    select: { id: true, avgHRbpm: true },
  });

  if (activities.length === 0) {
    console.log(`[backfill-feel] userId=${user.id} — no activities to backfill`);
    return Response.json({ updated: 0, message: "No hay actividades para actualizar." });
  }

  console.log(`[backfill-feel] userId=${user.id} — starting backfill for ${activities.length} activities`);

  let updated = 0;
  const batches = chunk(activities, 20);

  try {
    for (const batch of batches) {
      await Promise.all(
        batch.map((act) => {
          const feel = calculateFeel(act.avgHRbpm, user.maxHR);
          if (feel == null) return Promise.resolve();
          updated++;
          return prisma.activity.update({
            where: { id: act.id },
            data: { feel },
          });
        }),
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[backfill-feel] userId=${user.id} — failed after ${updated} updates: ${msg}`);
    return Response.json(
      { error: `Backfill parcial: ${updated} actualizados antes del error. ${msg}` },
      { status: 500 },
    );
  }

  console.log(`[backfill-feel] userId=${user.id} — done: ${updated}/${activities.length} updated`);
  return Response.json({ updated, total: activities.length });
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
