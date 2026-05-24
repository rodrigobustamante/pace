import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";
import type { ActivityItem } from "@/hooks/useActivities";

const FEEL_COLORS = ["", COLORS.blue, COLORS.green, COLORS.amber, COLORS.accent, COLORS.red];
const TYPE_EMOJI: Record<string, string> = {
  easy: "🟢",
  tempo: "🟡",
  long: "🔵",
  workout: "🔴",
  race: "🏆",
  strength: "🏋️",
  unknown: "⚪",
};

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1);
}

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = secPerKm % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

interface ActivityRowProps {
  activity: ActivityItem;
  onPress: () => void;
}

export function ActivityRow({ activity, onPress }: ActivityRowProps) {
  const feelColor = activity.feel ? FEEL_COLORS[activity.feel] : COLORS.textDim;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{TYPE_EMOJI[activity.type] ?? "⚪"}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {activity.name}
        </Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>{formatDistance(activity.distanceM)} km</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{formatPace(activity.paceSeckm)}/km</Text>
          {activity.avgHRbpm && (
            <>
              <Text style={styles.statDot}>·</Text>
              <Text style={styles.stat}>{activity.avgHRbpm} bpm</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.date}>{formatDate(activity.date)}</Text>
        <View style={styles.feelRow}>
          <View style={[styles.feelDot, { backgroundColor: feelColor }]} />
          <Ionicons name="chevron-forward" size={14} color={COLORS.textDim} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  left: {
    width: 32,
    alignItems: "center",
  },
  emoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stat: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statDot: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: COLORS.textDim,
  },
  feelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
