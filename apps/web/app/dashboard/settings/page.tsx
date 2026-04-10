import { getCurrentUser } from "@/lib/auth";
import { HRZonesSetup } from "@/components/HRZonesSetup";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          Perfil
        </div>
        <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          Configura tus datos para cálculos personalizados
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {/* Athlete info */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {user?.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImageUrl}
              alt={user.name}
              style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
              Conectado con Strava
            </div>
          </div>
        </div>

        {/* maxHR setting */}
        <div style={{ padding: "20px 24px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            Frecuencia cardíaca
          </div>
          <HRZonesSetup currentMaxHR={user?.maxHR} />
        </div>
      </div>
    </div>
  );
}
