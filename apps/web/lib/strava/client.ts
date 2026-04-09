import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export async function getStravaClient(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  let accessToken = decrypt(user.accessToken);

  // Refresh proactively if token expires within 10 minutes
  if (user.tokenExpiresAt < new Date(Date.now() + 10 * 60 * 1000)) {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: decrypt(user.refreshToken),
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      throw new Error(`Strava token refresh failed: ${await res.text()}`);
    }

    const data = await res.json();
    accessToken = data.access_token;

    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        tokenExpiresAt: new Date(data.expires_at * 1000),
      },
    });
  }

  return {
    get: async (path: string, params?: Record<string, string>) => {
      const url = new URL(`https://www.strava.com/api/v3${path}`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Strava API error ${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
  };
}
