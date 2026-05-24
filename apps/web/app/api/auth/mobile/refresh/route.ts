import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { redis } from "@/lib/redis";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/jwt";

const REFRESH_TTL = 60 * 60 * 24 * 90; // 90 days

export async function POST(req: NextRequest) {
  let refreshToken: string;
  try {
    const body = (await req.json()) as { refreshToken?: unknown };
    if (typeof body.refreshToken !== "string" || !body.refreshToken) {
      return NextResponse.json({ error: "refreshToken required" }, { status: 400 });
    }
    refreshToken = body.refreshToken;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Verify JWT signature and type claim
  let userId: string;
  try {
    const payload = await verifyRefreshToken(refreshToken);
    userId = payload.sub;
  } catch {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  // Verify token is still in Redis (allows server-side revocation)
  const oldHash = createHash("sha256").update(refreshToken).digest("hex");
  const stored = await redis.get(`mobile:refresh:${oldHash}`);
  if (!stored) {
    return NextResponse.json({ error: "Token revoked or expired" }, { status: 401 });
  }

  // Rotate: delete old, issue new pair
  await redis.del(`mobile:refresh:${oldHash}`);

  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken(userId),
    signRefreshToken(userId),
  ]);

  const newHash = createHash("sha256").update(newRefreshToken).digest("hex");
  await redis.setex(`mobile:refresh:${newHash}`, REFRESH_TTL, userId);

  return NextResponse.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
}
