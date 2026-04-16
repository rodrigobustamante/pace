import { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
  });

  if (!goal) {
    return Response.json({ error: "Objetivo no encontrado" }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });

  return Response.json({ ok: true });
}
