import { assignInlineVars } from "@vanilla-extract/dynamic";
import * as styles from "@/styles/statCard.css";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div
      className={styles.root}
      style={assignInlineVars({ [styles.accentVar]: accent })}
    >
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
