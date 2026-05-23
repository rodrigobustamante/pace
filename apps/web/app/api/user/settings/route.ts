import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALL_MODELS } from "@/services/ai/registry";

const VALID_MODEL_IDS = ALL_MODELS.map((m) => m.id) as [string, ...string[]];

const schema = z.object({
  maxHR: z.number().int().min(100).max(250).optional(),
  preferredModel: z.enum(VALID_MODEL_IDS).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { maxHR, preferredModel } = parsed.data;
  if (!maxHR && !preferredModel) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(maxHR !== undefined ? { maxHR } : {}),
      ...(preferredModel !== undefined ? { preferredModel } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
