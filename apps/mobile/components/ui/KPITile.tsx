import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/lib/constants";

interface KPITileProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export function KPITile({ label, value, unit, color = COLORS.text }: KPITileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
  },
  unit: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
