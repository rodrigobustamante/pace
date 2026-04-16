import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; date: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: goalId, date } = await params;

  let willTrain: boolean | null;
  try {
    const body = (await req.json()) as { willTrain?: unknown };
    if (body.willTrain === null) {
      willTrain = null;
    } else if (typeof body.willTrain === "boolean") {
      willTrain = body.willTrain;
    } else {
      throw new Error("invalid");
    }
  } catch {
    return Response.json({ error: "Campo willTrain inválido" }, { status: 400 });
  }

  // Verify the goal belongs to user
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId: user.id },
    include: { trainingPlan: true },
  });

  if (!goal?.trainingPlan) {
    return Response.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return Response.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const day = await prisma.trainingDay.updateMany({
    where: {
      planId: goal.trainingPlan.id,
      userId: user.id,
      date: parsedDate,
    },
    data: { willTrain },
  });

  if (day.count === 0) {
    return Response.json({ error: "Día no encontrado" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
