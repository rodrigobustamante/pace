import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { API_BASE_URL, COLORS } from "@/lib/constants";

export default function AuthCallbackScreen() {
  const { sessionCode } = useLocalSearchParams<{ sessionCode?: string }>();
  const { setTokens } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionCode) {
      setError("Código de sesión no recibido.");
      return;
    }

    async function exchangeCode() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/mobile/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionCode }),
        });

        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? `Error ${res.status}`);
        }

        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          userId: string;
        };

        await setTokens(data.userId, data.accessToken, data.refreshToken);
        router.replace("/(tabs)/");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
      }
    }

    void exchangeCode();
  }, [sessionCode, setTokens]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Error de autenticación</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <Text style={styles.retry} onPress={() => router.replace("/auth")}>
          Volver a intentar
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.loadingText}>Iniciando sesión…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  errorTitle: {
    color: COLORS.red,
    fontSize: 20,
    fontWeight: "700",
  },
  errorMsg: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  retry: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
});
