import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/appBaseUrl";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl();
  const platform = req.nextUrl.searchParams.get("platform");
  const mobileRedirect = req.nextUrl.searchParams.get("redirect");
  console.log("[strava/auth] initiating OAuth", { platform, hasMobileRedirect: !!mobileRedirect });

  // Strava ignores extra query params in redirect_uri — use `state` instead.
  // Strava returns `state` unchanged in the callback so we can recover it there.
  const statePayload = platform
    ? Buffer.from(JSON.stringify({ platform, redirect: mobileRedirect })).toString("base64")
    : undefined;

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${base}/api/strava/callback`,
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
  });
  if (statePayload) params.set("state", statePayload);

  redirect(`${STRAVA_AUTH_URL}?${params}`);
}
