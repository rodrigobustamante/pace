import * as styles from "@/styles/skeleton.css";

export function SkeletonCard({ height = 120 }: { height?: number }) {
  return <div className={styles.root} style={{ height }} />;
}
