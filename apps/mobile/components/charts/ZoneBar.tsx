import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/lib/constants";
import type { ZoneMinutes } from "@/hooks/useMetrics";

const ZONE_COLORS = ["", COLORS.blue, COLORS.green, COLORS.amber, COLORS.accent, COLORS.red];
const ZONE_LABELS = ["", "Z1 Rec.", "Z2 Base", "Z3 Umbral", "Z4 Tempo", "Z5 VO2"];

interface ZoneBarProps {
  zones: ZoneMinutes | null;
}

export function ZoneBar({ zones }: ZoneBarProps) {
  if (!zones) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Configura tu FC máxima para ver zonas</Text>
      </View>
    );
  }

  const values = [zones.z1, zones.z2, zones.z3, zones.z4, zones.z5];
  const total = values.reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sin datos de zona (90 días)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stacked bar */}
      <View style={styles.bar}>
        {values.map((v, i) => {
          const pct = (v / total) * 100;
          if (pct < 1) return null;
          return (
            <View
              key={i}
              style={[styles.segment, { flex: pct, backgroundColor: ZONE_COLORS[i + 1] }]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {values.map((v, i) => {
          const pct = Math.round((v / total) * 100);
          if (pct < 1) return null;
          const hours = Math.floor(v / 60);
          const mins = v % 60;
          const timeStr = hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
          return (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: ZONE_COLORS[i + 1] }]} />
              <View>
                <Text style={styles.zoneName}>{ZONE_LABELS[i + 1]}</Text>
                <Text style={styles.zoneTime}>
                  {timeStr} · {pct}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  bar: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    gap: 2,
  },
  segment: { borderRadius: 3 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "30%",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  zoneName: { fontSize: 11, color: COLORS.textMuted },
  zoneTime: { fontSize: 11, color: COLORS.textDim },
  empty: { paddingVertical: 16, alignItems: "center" },
  emptyText: { fontSize: 12, color: COLORS.textDim, fontStyle: "italic" },
});
