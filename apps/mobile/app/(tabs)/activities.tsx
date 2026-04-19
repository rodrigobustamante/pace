import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { apiFetch } from "@/lib/api";
import type { Activity } from "@pace/types";

interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_ICONS: Record<string, string> = {
  easy: "🏃",
  tempo: "⚡",
  long: "🛣️",
  workout: "💪",
  race: "🏁",
  unknown: "❓",
};

function secToPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ActivitiesScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage(1);
  }, []);

  async function loadPage(p: number) {
    setLoading(true);
    try {
      const res = await apiFetch<ActivitiesResponse>(
        `/api/activities?page=${p}&limit=20`,
      );
      setActivities(p === 1 ? res.activities : (prev) => [...prev, ...res.activities]);
      setPage(p);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    if (page < totalPages && !loading) loadPage(page + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Actividades</Text>
        <Text style={styles.sub}>{activities.length} carreras</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loading ? <ActivityIndicator color="#f97316" style={{ marginVertical: 20 }} /> : null
        }
        renderItem={({ item: a }) => {
          const km = (a.distanceM / 1000).toFixed(1);
          const date = new Date(a.date).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          });
          return (
            <View style={styles.row}>
              <Text style={styles.rowIcon}>{TYPE_ICONS[a.type] ?? "🏃"}</Text>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={1}>{a.name}</Text>
                <Text style={styles.rowMeta}>{date}</Text>
              </View>
              <View style={styles.rowStats}>
                <Text style={styles.rowKm}>{km} km</Text>
                <Text style={styles.rowPace}>{secToPace(a.paceSeckm)} /km</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d1a" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "700", color: "#f1f5f9" },
  sub: { fontSize: 13, color: "#475569", marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  rowIcon: { fontSize: 22, width: 32, textAlign: "center" },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  rowMeta: { fontSize: 12, color: "#475569", marginTop: 2 },
  rowStats: { alignItems: "flex-end" },
  rowKm: { fontSize: 14, fontWeight: "700", color: "#f97316" },
  rowPace: { fontSize: 11, color: "#64748b", marginTop: 2 },
  error: { color: "#f87171", textAlign: "center", marginTop: 40 },
});
