interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: accent,
          borderRadius: "16px 16px 0 0",
        }}
      />
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#f1f5f9",
          fontFamily: "'Barlow Condensed', sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}
