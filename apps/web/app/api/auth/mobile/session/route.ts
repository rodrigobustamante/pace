import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { redis } from "@/lib/redis";
import { signAccessToken, signRefreshToken } from "@/lib/jwt";

const REFRESH_TTL = 60 * 60 * 24 * 90; // 90 days

export async function POST(req: NextRequest) {
  let sessionCode: string;
  try {
    const body = (await req.json()) as { sessionCode?: unknown };
    if (typeof body.sessionCode !== "string" || !body.sessionCode) {
      return NextResponse.json({ error: "sessionCode required" }, { status: 400 });
    }
    sessionCode = body.sessionCode;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Validate one-time code from Redis
  const redisKey = `mobile:session:${sessionCode}`;
  const userId = await redis.get(redisKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or expired session code" }, { status: 401 });
  }

  // Delete immediately — one-time use
  await redis.del(redisKey);

  // Issue tokens
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(userId),
    signRefreshToken(userId),
  ]);

  // Store refresh token hash in Redis (never store raw token)
  const hash = createHash("sha256").update(refreshToken).digest("hex");
  await redis.setex(`mobile:refresh:${hash}`, REFRESH_TTL, userId);

  return NextResponse.json({ accessToken, refreshToken, userId });
}
