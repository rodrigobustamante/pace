interface CoachInsightCardProps {
  type: "warning" | "positive" | "tip" | "prediction";
  title: string;
  body: string;
}

const insightColors = {
  warning: { border: "#fb923c", glow: "rgba(251,146,60,0.15)" },
  positive: { border: "#4ade80", glow: "rgba(74,222,128,0.15)" },
  tip: { border: "#60a5fa", glow: "rgba(96,165,250,0.15)" },
  prediction: { border: "#e879f9", glow: "rgba(232,121,249,0.15)" },
};

const insightIcons = {
  warning: "⚡",
  positive: "📈",
  tip: "🦵",
  prediction: "🏁",
};

export function CoachInsightCard({ type, title, body }: CoachInsightCardProps) {
  const colors = insightColors[type];
  const icon = insightIcons[type];

  return (
    <div
      className="insight-card"
      style={{
        background: colors.glow,
        border: `1px solid ${colors.border}40`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>{icon}</div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: colors.border,
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <div
            style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}
          >
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}
