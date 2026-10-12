/**
 * Vercel Cron calls each path with GET and `Authorization: Bearer $CRON_SECRET`.
 * Without a configured secret every request is rejected, so a missing env var
 * can't turn into `Bearer undefined` being accepted.
 */
export function isCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
