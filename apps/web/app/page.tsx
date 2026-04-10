import Link from "next/link";

export default function Home() {
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
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 24px",
          }}
        >
          🏃
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          PACE
        </div>

        <div style={{ fontSize: 14, color: "#475569", marginBottom: 40 }}>
          Tu analítica de running personalizada
        </div>

        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #f97316, #ef4444)",
            borderRadius: 10,
            padding: "12px 32px",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Entrar con Strava
        </Link>
      </div>
    </div>
  );
}
