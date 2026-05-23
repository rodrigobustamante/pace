import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAndPersistTrainingPlan } from "@/services/goals/trainingPlanGeneration";
import { localDateStr } from "@/services/coach/context";

function dayKeyUtc(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

function buildComplianceNotes(
  days: Array<{
    date: Date;
    title: string;
    workoutType: string;
    willTrain: boolean | null;
  }>,
  todayStr: string,
): string[] {
  const lines: string[] = [];
  for (const d of days) {
    if (d.workoutType === "unknown") continue;
    const dayStr = dayKeyUtc(d.date);
    const isPast = dayStr < todayStr;
    const isToday = dayStr === todayStr;
    if (!isPast && !(isToday && d.willTrain !== null)) continue;

    if (isPast) {
      if (d.willTrain === true) {
        lines.push(`${dayStr}: "${d.title}" — confirmó que entrenó`);
      } else if (d.willTrain === false) {
        lines.push(
          `${dayStr}: "${d.title}" — NO entrenó (sesión saltada; ajusta carga y recuperación)`,
        );
      } else {
        lines.push(`${dayStr}: "${d.title}" — sin confirmar en la app`);
      }
    } else if (isToday) {
      if (d.willTrain === true) {
        lines.push(`${dayStr} (hoy): "${d.title}" — confirmó que entrenará`);
      } else if (d.willTrain === false) {
        lines.push(
          `${dayStr} (hoy): "${d.title}" — NO entrenará (adapta el resto de la semana)`,
        );
      }
    }
  }
  return lines;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(_req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: goalId } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id, isActive: true },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  if (!goal) {
    return Response.json({ error: "Objetivo no encontrado" }, { status: 404 });
  }

  if (goal.targetDate <= new Date()) {
    return Response.json(
      { error: "La fecha del objetivo ya pasó; no se puede regenerar el plan" },
      { status: 400 },
    );
  }

  const tz = _req.headers.get("X-User-Timezone") ?? "UTC";
  const todayStr = localDateStr(tz);
  const existingDays = goal.trainingPlan?.days ?? [];
  const fromApp = buildComplianceNotes(existingDays, todayStr);
  const coachNotes =
    fromApp.length > 0
      ? fromApp
      : [
          "No hay confirmaciones de entrenos en la app para días pasados; usa el historial de Strava y el estado actual del atleta.",
        ];

  const otherGoals = await prisma.goal.findMany({
    where: { userId: user.id, isActive: true, id: { not: goal.id } },
    orderBy: { targetDate: "asc" },
    select: { title: true, targetDate: true, location: true, priority: true },
  });

  try {
    const plan = await generateAndPersistTrainingPlan({
      prisma,
      userId: user.id,
      goalId: goal.id,
      goalTitle: goal.title,
      goalTargetDate: goal.targetDate,
      goalLocation: goal.location ?? undefined,
      goalPriority: goal.priority,
      otherMilestones: otherGoals.map((g) => ({
        title: g.title,
        targetDate: g.targetDate.toISOString().split("T")[0]!,
        location: g.location ?? undefined,
        priority: g.priority,
      })),
      replaceExisting: true,
      coachNotes,
      timezone: tz,
    });

    return Response.json({ goal, plan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return Response.json(
      { error: `Error regenerando el plan: ${msg}` },
      { status: 500 },
    );
  }
}
