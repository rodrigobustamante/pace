import { ScrollView, View, Text, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCoachDaily } from "@/hooks/useCoachDaily";
import { DailyCoachCard } from "@/components/DailyCoachCard";
import { COLORS } from "@/lib/constants";

export default function CoachScreen() {
  const dailyQuery = useCoachDaily();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={dailyQuery.isFetching}
            onRefresh={() => void dailyQuery.refetch()}
            tintColor={COLORS.accent}
          />
        }
      >
        <Text style={styles.pageTitle}>Coach</Text>

        {/* Full daily recommendation */}
        <DailyCoachCard
          data={dailyQuery.data}
          isLoading={dailyQuery.isLoading}
          compact={false}
        />

        {/* Chat CTA */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push("/(tabs)/coach/chat")}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={COLORS.bg} />
          <Text style={styles.chatButtonText}>Hablar con el coach</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.bg} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  chatButtonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
});
