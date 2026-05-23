import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAndPersistTrainingPlan } from "@/services/goals/trainingPlanGeneration";
import type { GoalType } from "@pace/types";

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  race_5k: "Carrera 5K",
  race_10k: "Carrera 10K",
  half_marathon: "Media Maratón",
  marathon: "Maratón",
  custom: "Objetivo personalizado",
};

const VALID_PRIORITIES = new Set(["A", "B", "C"]);

/** GET /api/goals — returns all active milestones sorted by race date */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { targetDate: "asc" },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  return Response.json({ goals });
}

/** POST /api/goals — creates a new milestone without deactivating existing ones */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let title: string;
  let goalType: GoalType;
  let targetDate: string;
  let location: string | undefined;
  let priority: string;

  try {
    const body = (await req.json()) as {
      title?: unknown;
      goalType?: unknown;
      targetDate?: unknown;
      location?: unknown;
      priority?: unknown;
    };

    if (
      typeof body.goalType !== "string" ||
      typeof body.targetDate !== "string"
    ) {
      throw new Error("invalid fields");
    }

    title = typeof body.title === "string" ? body.title.trim() : "";
    goalType = body.goalType as GoalType;
    targetDate = body.targetDate;
    location =
      typeof body.location === "string" && body.location.trim()
        ? body.location.trim()
        : undefined;
    priority =
      typeof body.priority === "string" && VALID_PRIORITIES.has(body.priority)
        ? body.priority
        : "A";
  } catch {
    return Response.json({ error: "Campos inválidos" }, { status: 400 });
  }

  const parsedDate = new Date(targetDate);
  if (isNaN(parsedDate.getTime())) {
    return Response.json({ error: "Fecha inválida" }, { status: 400 });
  }
  if (parsedDate <= new Date()) {
    return Response.json(
      { error: "La fecha debe ser en el futuro" },
      { status: 400 },
    );
  }

  // Check for duplicate milestone on the same date
  const existing = await prisma.goal.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      targetDate: parsedDate,
    },
  });
  if (existing) {
    return Response.json(
      { error: "Ya tienes un hito registrado en esa fecha" },
      { status: 409 },
    );
  }

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: title || GOAL_TYPE_LABELS[goalType] || "Mi hito",
      goalType,
      targetDate: parsedDate,
      isActive: true,
      location,
      priority,
    },
  });

  const tz = req.headers.get("X-User-Timezone") ?? "UTC";

  // Fetch other active milestones to inform the plan generator
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
      goalTargetDate: parsedDate,
      goalLocation: location,
      goalPriority: priority,
      otherMilestones: otherGoals.map((g) => ({
        title: g.title,
        targetDate: g.targetDate.toISOString().split("T")[0]!,
        location: g.location ?? undefined,
        priority: g.priority,
      })),
      replaceExisting: false,
      timezone: tz,
    });

    return Response.json({ goal, plan });
  } catch (err) {
    await prisma.goal.delete({ where: { id: goal.id } });
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return Response.json(
      { error: `Error generando el plan: ${msg}` },
      { status: 500 },
    );
  }
}
