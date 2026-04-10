import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  maxHR: z.number().int().min(100).max(250),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "FC máx inválida" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { maxHR: parsed.data.maxHR },
  });

  return NextResponse.json({ ok: true });
}
