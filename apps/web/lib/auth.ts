import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";

export async function getCurrentUser() {
  const userId = (await cookies()).get("pace_user_id")?.value;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getUserFromRequest(req: NextRequest) {
  // 1. Cookie-based session (web)
  const cookieUserId = req.cookies.get("pace_user_id")?.value;
  if (cookieUserId) {
    return prisma.user.findUnique({ where: { id: cookieUserId } });
  }

  // 2. Bearer JWT (mobile)
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const { sub: userId } = await verifyAccessToken(token);
      return prisma.user.findUnique({ where: { id: userId } });
    } catch {
      return null;
    }
  }

  return null;
}
