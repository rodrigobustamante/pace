import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { apiFetch } from "@/lib/api";

interface FitnessPoint {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
}

interface WeeklyPoint {
  week: string;
  km: number;
  tss: number;
  avgPace: number;
}

interface MetricsData {
  fitness: FitnessPoint[];
  weeklyData: WeeklyPoint[];
  maxHR: number | null;
}

function secToPace(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MetricsScreen() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MetricsData>("/api/metrics")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const latest = data?.fitness[data.fitness.length - 1];
  const last8Weeks = data?.weeklyData.slice(-8) ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Métricas</Text>
        <Text style={styles.sub}>Evolución de tu rendimiento</Text>
      </View>

      {loading && <ActivityIndicator color="#f97316" style={{ marginTop: 40 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {latest && (
        <>
          <Text style={styles.sectionTitle}>Forma actual</Text>
          <View style={styles.formRow}>
            <FormMetric label="CTL" value={Math.round(latest.ctl)} color="#f97316" desc="Fitness crónico" />
            <FormMetric label="ATL" value={Math.round(latest.atl)} color="#ef4444" desc="Fatiga aguda" />
            <FormMetric label="TSB" value={Math.round(latest.tsb)} color="#4ade80" desc="Forma" />
          </View>

          <Text style={styles.sectionTitle}>Últimas 8 semanas</Text>
          {last8Weeks.map((w, i) => (
            <View key={i} style={styles.weekRow}>
              <Text style={styles.weekLabel}>{w.week}</Text>
              <View style={styles.weekBar}>
                <View
                  style={[
                    styles.weekBarFill,
                    { width: `${Math.min((w.km / 80) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.weekKm}>{w.km.toFixed(0)} km</Text>
              <Text style={styles.weekPace}>{secToPace(w.avgPace)}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function FormMetric({
  label,
  value,
  color,
  desc,
}: {
  label: string;
  value: number;
  color: string;
  desc: string;
}) {
  return (
    <View style={[styles.formCard, { borderColor: `${color}33` }]}>
      <Text style={[styles.formValue, { color }]}>{value}</Text>
      <Text style={styles.formLabel}>{label}</Text>
      <Text style={styles.formDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d1a" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: "700", color: "#f1f5f9" },
  sub: { fontSize: 13, color: "#475569", marginTop: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 24,
  },
  formRow: { flexDirection: "row", gap: 10 },
  formCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  formValue: { fontSize: 28, fontWeight: "700" },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", marginTop: 2 },
  formDesc: { fontSize: 10, color: "#475569", marginTop: 2, textAlign: "center" },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  weekLabel: { fontSize: 11, color: "#475569", width: 44 },
  weekBar: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  weekBarFill: {
    height: "100%",
    backgroundColor: "#f97316",
    borderRadius: 3,
  },
  weekKm: { fontSize: 12, fontWeight: "700", color: "#f97316", width: 42, textAlign: "right" },
  weekPace: { fontSize: 11, color: "#475569", width: 44, textAlign: "right" },
  error: { color: "#f87171", textAlign: "center", marginTop: 40 },
});
