import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export interface AccessTokenPayload {
  sub: string; // userId
}

export interface RefreshTokenPayload {
  sub: string; // userId
  type: "refresh";
}

/** Issues a 30-day access token for mobile API calls. */
export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

/** Verifies an access token and returns its payload. Throws on invalid/expired. */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  if (typeof payload.sub !== "string") throw new Error("Invalid token payload");
  return { sub: payload.sub };
}

/** Issues a 90-day refresh token. */
export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(getSecret());
}

/** Verifies a refresh token. Throws on invalid/expired/wrong type. */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  if (typeof payload.sub !== "string" || payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return { sub: payload.sub, type: "refresh" };
}
