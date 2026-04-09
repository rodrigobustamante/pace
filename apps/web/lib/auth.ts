import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const userId = (await cookies()).get("pace_user_id")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getUserFromRequest(req: NextRequest) {
  const userId = req.cookies.get("pace_user_id")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
