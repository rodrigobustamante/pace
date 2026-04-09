import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/appBaseUrl";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { exchangeAuthorizationCode } from "@/lib/strava/tokenRequest";
import { syncActivities } from "@/services/strava/sync";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/auth/error", req.url));
  }

  const redirectUri = `${getAppBaseUrl()}/api/strava/callback`;

  const tokenRes = await exchangeAuthorizationCode(code, redirectUri);

  if (!tokenRes.ok) {
    console.error("Strava token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/auth/error", req.url));
  }

  const { access_token, refresh_token, expires_at, athlete } =
    await tokenRes.json();

  const user = await prisma.user.upsert({
    where: { stravaAthleteId: athlete.id },
    create: {
      stravaAthleteId: athlete.id,
      name: `${athlete.firstname} ${athlete.lastname}`,
      profileImageUrl: athlete.profile,
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt: new Date(expires_at * 1000),
    },
    update: {
      accessToken: encrypt(access_token),
      refreshToken: encrypt(refresh_token),
      tokenExpiresAt: new Date(expires_at * 1000),
      name: `${athlete.firstname} ${athlete.lastname}`,
      profileImageUrl: athlete.profile,
    },
  });

  // Background sync — fire and forget
  syncActivities(user.id).catch(console.error);

  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("pace_user_id", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return response;
}
