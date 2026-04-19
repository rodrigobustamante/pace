import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/appBaseUrl";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl();
  const platform = req.nextUrl.searchParams.get("platform");
  const mobileRedirect = req.nextUrl.searchParams.get("redirect");

  // Pass platform + redirect through to callback so it can handle mobile deep link
  const callbackUrl = new URL(`${base}/api/strava/callback`);
  if (platform) callbackUrl.searchParams.set("platform", platform);
  if (mobileRedirect) callbackUrl.searchParams.set("redirect", mobileRedirect);

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: callbackUrl.toString(),
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
  });
  redirect(`${STRAVA_AUTH_URL}?${params}`);
}
