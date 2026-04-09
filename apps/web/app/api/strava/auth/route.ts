import { redirect } from "next/navigation";
import { getAppBaseUrl } from "@/lib/appBaseUrl";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";

export async function GET() {
  const base = getAppBaseUrl();
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: `${base}/api/strava/callback`,
    response_type: "code",
    scope: "activity:read_all",
    approval_prompt: "auto",
  });
  redirect(`${STRAVA_AUTH_URL}?${params}`);
}
