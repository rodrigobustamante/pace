import { FlatList, View, Text, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useActivities } from "@/hooks/useActivities";
import { ActivityRow } from "@/components/ActivityRow";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { COLORS } from "@/lib/constants";

export default function ActivitiesScreen() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isFetching } =
    useActivities();

  const activities = data?.pages.flatMap((p) => p.activities) ?? [];

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando actividades…" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>Actividades</Text>
        <Text style={styles.count}>{activities.length} cargadas</Text>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityRow
            activity={item}
            onPress={() => router.push(`/(tabs)/activities/${item.id}`)}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isFetchingNextPage}
            onRefresh={() => void refetch()}
            tintColor={COLORS.accent}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <LoadingSpinner />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay actividades todavía.</Text>
            <Text style={styles.emptyHint}>
              Sincroniza con Strava para ver tus carreras.
            </Text>
          </View>
        }
        contentContainerStyle={activities.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  count: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footer: {
    paddingVertical: 16,
  },
  empty: {
    gap: 8,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
