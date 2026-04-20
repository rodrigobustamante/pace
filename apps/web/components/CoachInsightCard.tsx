import { assignInlineVars } from "@vanilla-extract/dynamic";
import * as styles from "@/styles/coachInsightCard.css";

interface CoachInsightCardProps {
  type: "warning" | "positive" | "tip" | "prediction" | "complementary";
  title: string;
  body: string;
}

const insightColors = {
  warning:       { border: "#fb923c", glow: "rgba(251,146,60,0.15)" },
  positive:      { border: "#4ade80", glow: "rgba(74,222,128,0.15)" },
  tip:           { border: "#60a5fa", glow: "rgba(96,165,250,0.15)" },
  prediction:    { border: "#e879f9", glow: "rgba(232,121,249,0.15)" },
  complementary: { border: "#2dd4bf", glow: "rgba(45,212,191,0.15)" },
};

const insightIcons = {
  warning:       "⚡",
  positive:      "📈",
  tip:           "🦵",
  prediction:    "🏁",
  complementary: "🏋️",
};

export function CoachInsightCard({ type, title, body }: CoachInsightCardProps) {
  const colors = insightColors[type];
  const icon = insightIcons[type];

  return (
    <div
      className={styles.root}
      style={assignInlineVars({
        [styles.borderColorVar]: `${colors.border}40`,
        [styles.glowVar]: colors.glow,
        [styles.titleColorVar]: colors.border,
      })}
    >
      <div className={styles.row}>
        <div className={styles.icon}>{icon}</div>
        <div>
          <div className={styles.title}>{title}</div>
          <div className={styles.body}>{body}</div>
        </div>
      </div>
    </div>
  );
}
