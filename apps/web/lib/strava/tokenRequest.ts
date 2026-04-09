/**
 * Strava expects token requests as application/x-www-form-urlencoded, not JSON.
 * @see https://developers.strava.com/docs/authentication/
 */
const STRAVA_TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<Response> {
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  return fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function refreshAccessToken(refreshToken: string): Promise<Response> {
  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}
