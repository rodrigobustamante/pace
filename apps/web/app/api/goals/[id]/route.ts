import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_PRIORITIES = new Set(["A", "B", "C"]);

/** DELETE /api/goals/[id] — soft-delete (sets isActive = false) */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const user = await getUserFromRequest(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
  });
  if (!goal) {
    return Response.json({ error: "Hito no encontrado" }, { status: 404 });
  }

  await prisma.goal.update({
    where: { id },
    data: { isActive: false },
  });

  return Response.json({ ok: true });
}

/** PATCH /api/goals/[id] — update title, location, or priority */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const user = await getUserFromRequest(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id, isActive: true },
  });
  if (!goal) {
    return Response.json({ error: "Hito no encontrado" }, { status: 404 });
  }

  let body: { title?: unknown; location?: unknown; priority?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const data: { title?: string; location?: string | null; priority?: string } =
    {};

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim();
  }
  if (body.location !== undefined) {
    data.location =
      typeof body.location === "string" && body.location.trim()
        ? body.location.trim()
        : null;
  }
  if (
    typeof body.priority === "string" &&
    VALID_PRIORITIES.has(body.priority)
  ) {
    data.priority = body.priority;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.goal.update({ where: { id }, data });
  return Response.json({ goal: updated });
}
