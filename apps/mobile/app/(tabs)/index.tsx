import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { apiFetch } from "@/lib/api";
import { clearUserId } from "@/lib/auth";

interface MetricsData {
  weeklyData: Array<{ week: string; km: number; tss: number }>;
  fitness: Array<{ date: string; ctl: number; atl: number; tsb: number }>;
  maxHR: number | null;
}

export default function OverviewScreen() {
  const router = useRouter();
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MetricsData>("/api/metrics")
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    Alert.alert("Salir", "¿Cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await clearUserId();
          router.replace("/(auth)");
        },
      },
    ]);
  }

  const latest = data?.fitness[data.fitness.length - 1];
  const thisWeek = data?.weeklyData[data.weeklyData.length - 1];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Overview</Text>
          <Text style={styles.sub}>Tu forma actual</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Salir</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#f97316" style={{ marginTop: 40 }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {latest && (
        <View style={styles.grid}>
          <StatCard label="CTL" value={Math.round(latest.ctl)} sub="Fitness" color="#f97316" />
          <StatCard label="ATL" value={Math.round(latest.atl)} sub="Fatiga" color="#ef4444" />
          <StatCard label="TSB" value={Math.round(latest.tsb)} sub="Forma" color="#4ade80" />
          <StatCard
            label="KM semana"
            value={thisWeek ? Math.round(thisWeek.km) : 0}
            sub="esta semana"
            color="#60a5fa"
          />
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <View style={[styles.card, { borderColor: `${color}33` }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d1a" },
  content: { padding: 20, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#f1f5f9" },
  sub: { fontSize: 13, color: "#475569", marginTop: 2 },
  logoutBtn: { fontSize: 13, color: "#475569", paddingTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardLabel: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
  cardValue: { fontSize: 32, fontWeight: "700", marginTop: 4 },
  cardSub: { fontSize: 11, color: "#475569", marginTop: 2 },
  error: { color: "#f87171", textAlign: "center", marginTop: 40 },
});
