/**
 * OAuth redirect_uri and absolute links require a full origin (scheme + host).
 * If NEXT_PUBLIC_APP_URL is missing a scheme (common on Vercel), we add https://
 * or http:// for localhost.
 */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  const trimmed = raw.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const host = trimmed.replace(/^\/+/, "");
  if (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  ) {
    return `http://${host}`;
  }

  return `https://${host}`;
}
