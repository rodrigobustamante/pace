type SearchParams = Promise<{ reason?: string; status?: string }>;

export default async function AuthError({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { reason, status } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060d1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f1f5f9",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif",
            marginBottom: 8,
          }}
        >
          Error de autenticación
        </div>
        <div style={{ color: "#64748b", marginBottom: 24, fontSize: 13, fontFamily: "monospace" }}>
          {reason
            ? `reason: ${reason}${status ? ` (HTTP ${status})` : ""}`
            : "No se pudo completar la conexión con Strava."}
        </div>
        <a
          href="/api/strava/auth"
          style={{
            background: "rgba(249,115,22,0.2)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 8,
            padding: "10px 24px",
            color: "#fb923c",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Intentar de nuevo
        </a>
      </div>
    </div>
  );
}
