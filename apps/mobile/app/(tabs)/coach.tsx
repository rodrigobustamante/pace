import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { apiFetch } from "@/lib/api";

interface WeeklyCoach {
  summary: string;
  positive: { title: string; body: string };
  warning: { title: string; body: string };
  tip: { title: string; body: string };
  prediction: { title: string; body: string };
}

interface DailyAdvice {
  recommendation: "train" | "rest";
  title: string;
  body: string;
  sessionType: string | null;
  duration: number | null;
  intensity: string | null;
}

export default function CoachScreen() {
  const [weekly, setWeekly] = useState<WeeklyCoach | null>(null);
  const [daily, setDaily] = useState<DailyAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [w, d] = await Promise.all([
        apiFetch<WeeklyCoach>("/api/coach/weekly"),
        apiFetch<DailyAdvice>("/api/coach/daily"),
      ]);
      setWeekly(w);
      setDaily(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const isTrain = daily?.recommendation === "train";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Coach IA</Text>
        <TouchableOpacity onPress={loadData}>
          <Text style={styles.regenBtn}>↻ Actualizar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#f97316" style={{ marginTop: 40 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {daily && (
        <View style={[styles.dailyCard, isTrain ? styles.dailyTrain : styles.dailyRest]}>
          <Text style={[styles.dailyLabel, isTrain ? styles.labelTrain : styles.labelRest]}>
            {isTrain ? "HOY — ENTRENAR" : "HOY — DESCANSAR"}
          </Text>
          <Text style={styles.dailyTitle}>{daily.title}</Text>
          <Text style={styles.dailyBody}>{daily.body}</Text>
          {isTrain && daily.duration && (
            <View style={styles.chipRow}>
              {daily.sessionType && <Chip text={daily.sessionType} />}
              <Chip text={`${daily.duration} min`} />
              {daily.intensity && <Chip text={daily.intensity} />}
            </View>
          )}
        </View>
      )}

      {weekly && (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>📊</Text>
            <Text style={styles.summaryTitle}>Resumen semanal</Text>
            <Text style={styles.summaryText}>{weekly.summary}</Text>
          </View>

          {(
            [
              { key: "positive", emoji: "✅" },
              { key: "warning", emoji: "⚠️" },
              { key: "tip", emoji: "💡" },
              { key: "prediction", emoji: "🔮" },
            ] as const
          ).map(({ key, emoji }) => {
            const card = weekly[key];
            return (
              <View key={key} style={styles.insightCard}>
                <Text style={styles.insightEmoji}>{emoji}</Text>
                <View style={styles.insightBody}>
                  <Text style={styles.insightTitle}>{card.title}</Text>
                  <Text style={styles.insightText}>{card.body}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function Chip({ text }: { text: string }) {
  return <View style={styles.chip}><Text style={styles.chipText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d1a" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#f1f5f9" },
  regenBtn: { fontSize: 13, color: "#f97316" },
  dailyCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1 },
  dailyTrain: { backgroundColor: "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.2)" },
  dailyRest: { backgroundColor: "rgba(96,165,250,0.06)", borderColor: "rgba(96,165,250,0.2)" },
  dailyLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  labelTrain: { color: "#4ade80" },
  labelRest: { color: "#60a5fa" },
  dailyTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  dailyBody: { fontSize: 13, color: "#94a3b8", lineHeight: 20 },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  chip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, color: "#64748b" },
  summaryCard: {
    backgroundColor: "rgba(249,115,22,0.08)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  summaryEmoji: { fontSize: 28, marginBottom: 8 },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  summaryText: { fontSize: 13, color: "#94a3b8", lineHeight: 20 },
  insightCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  insightEmoji: { fontSize: 22, paddingTop: 2 },
  insightBody: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: "700", color: "#f1f5f9", marginBottom: 4 },
  insightText: { fontSize: 13, color: "#94a3b8", lineHeight: 19 },
  error: { color: "#f87171", textAlign: "center", marginTop: 40 },
});
