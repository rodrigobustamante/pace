import * as s from "@/styles/pagesShared.css";

type SearchParams = Promise<{ reason?: string; status?: string }>;

export default async function AuthError({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { reason, status } = await searchParams;

  return (
    <div className={s.authErrorRoot}>
      <div className={s.authErrorInner}>
        <div className={s.authErrorEmoji}>⚠️</div>
        <div className={s.authErrorTitle}>Error de autenticación</div>
        <div className={s.authErrorDetail}>
          {reason
            ? `reason: ${reason}${status ? ` (HTTP ${status})` : ""}`
            : "No se pudo completar la conexión con Strava."}
        </div>
        <a href="/api/strava/auth" className={s.authErrorRetry}>
          Intentar de nuevo
        </a>
      </div>
    </div>
  );
}
