"use client";

const zoneColors = ["#334155", "#3b82f6", "#22d3ee", "#f97316", "#ef4444"];
const zoneLabels = ["Base", "Aeróbico", "Umbral", "VO2max", "Neuromuscular"];
const zoneThresholds = [0, 0.6, 0.7, 0.8, 0.9, 1];

interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

function zoneRange(index: number, maxHR: number): string {
  const lo = Math.round(maxHR * zoneThresholds[index]!);
  const hi = Math.round(maxHR * zoneThresholds[index + 1]!) - 1;
  if (index === 0) return `< ${Math.round(maxHR * 0.6)} bpm`;
  if (index === 4) return `≥ ${Math.round(maxHR * 0.9)} bpm`;
  return `${lo}–${hi} bpm`;
}

export function HRZonesChart({
  zones,
  maxHR,
}: {
  zones: ZoneDistribution;
  maxHR?: number | null;
}) {
  const values = [zones.z1, zones.z2, zones.z3, zones.z4, zones.z5];
  const total = values.reduce((s, v) => s + v, 0);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 4,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Distribución FC
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "'Barlow Condensed', sans-serif",
          marginBottom: 16,
        }}
      >
        Zonas
      </div>
      {values.map((minutes, i) => {
        const pct = total > 0 ? Math.round((minutes / total) * 100) : 0;
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>
                  Z{i + 1}{" "}
                  <span style={{ color: "#475569" }}>· {zoneLabels[i]}</span>
                </span>
                {maxHR && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "#334155",
                      fontFamily: "'DM Mono', monospace",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {zoneRange(i, maxHR)}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {Math.round(minutes)}min{" "}
                <span style={{ color: "#475569" }}>({pct}%)</span>
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.06)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: zoneColors[i] ?? "#fb923c",
                  borderRadius: 3,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
