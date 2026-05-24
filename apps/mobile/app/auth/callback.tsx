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
      const url = `${API_BASE_URL}/api/auth/mobile/session`;
      console.log("[callback] exchangeCode start", { url, sessionCode: sessionCode?.slice(0, 8) });
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionCode }),
        });

        console.log("[callback] response", { status: res.status, ok: res.ok, url: res.url });

        if (!res.ok) {
          const text = await res.text();
          console.error("[callback] non-ok response body:", text);
          let errorMsg: string;
          try {
            const body = JSON.parse(text) as { error?: string };
            errorMsg = body.error ?? `Error ${res.status}`;
          } catch {
            errorMsg = text || `Error ${res.status}`;
          }
          throw new Error(errorMsg);
        }

        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          userId: string;
        };

        console.log("[callback] tokens received, storing...", { userId: data.userId });
        await setTokens(data.userId, data.accessToken, data.refreshToken);
        console.log("[callback] tokens stored, navigating to tabs");
        router.replace("/(tabs)/");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        console.error("[callback] exchangeCode error:", msg);
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
