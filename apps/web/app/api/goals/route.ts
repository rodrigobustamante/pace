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

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goal = await prisma.goal.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      trainingPlan: {
        include: { days: { orderBy: { date: "asc" } } },
      },
    },
  });

  return Response.json({ goal });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let title: string;
  let goalType: GoalType;
  let targetDate: string;

  try {
    const body = (await req.json()) as {
      title?: unknown;
      goalType?: unknown;
      targetDate?: unknown;
    };
    if (
      typeof body.title !== "string" ||
      typeof body.goalType !== "string" ||
      typeof body.targetDate !== "string"
    ) {
      throw new Error("invalid fields");
    }
    title = body.title.trim();
    goalType = body.goalType as GoalType;
    targetDate = body.targetDate;
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

  // Deactivate any existing active goals
  await prisma.goal.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  });

  // Create the goal
  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: title || GOAL_TYPE_LABELS[goalType] || "Mi objetivo",
      goalType,
      targetDate: parsedDate,
      isActive: true,
    },
  });

  // Generate training plan with Gemini
  try {
    const plan = await generateAndPersistTrainingPlan({
      prisma,
      userId: user.id,
      goalId: goal.id,
      goalTitle: goal.title,
      goalTargetDate: parsedDate,
      replaceExisting: false,
    });

    return Response.json({ goal, plan });
  } catch (err) {
    // If plan generation fails, clean up and return error
    await prisma.goal.delete({ where: { id: goal.id } });
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return Response.json(
      { error: `Error generando el plan: ${msg}` },
      { status: 500 },
    );
  }
}
