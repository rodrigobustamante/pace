import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { API_BASE_URL, COLORS } from "@/lib/constants";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStravaLogin() {
    setLoading(true);
    setError(null);
    try {
      const redirectUri = encodeURIComponent("pace://auth/callback");
      const url = `${API_BASE_URL}/api/strava/auth?platform=mobile&redirect=${redirectUri}`;
      const result = await WebBrowser.openAuthSessionAsync(url, "pace://");

      if (result.type !== "success") {
        // User cancelled — not an error
      }
    } catch {
      setError("No se pudo conectar con Strava. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / branding */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>PACE</Text>
          <Text style={styles.tagline}>Tu entrenador de running personal</Text>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          {[
            "📊 CTL / ATL / TSB en tiempo real",
            "🤖 Coach AI personalizado",
            "🏃 Análisis de actividades Strava",
            "🎯 Planes de entrenamiento adaptativos",
          ].map((feature) => (
            <Text key={feature} style={styles.feature}>
              {feature}
            </Text>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.stravaButton, loading && styles.buttonDisabled]}
            onPress={handleStravaLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.stravaButtonText}>Conectar con Strava</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Conectamos de forma segura con tu cuenta de Strava.{"\n"}
            Nunca compartimos tus datos.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    paddingVertical: 48,
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 40,
  },
  logoText: {
    fontSize: 64,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  features: {
    gap: 14,
  },
  feature: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 2,
  },
  ctaSection: {
    gap: 16,
  },
  errorText: {
    color: COLORS.red,
    textAlign: "center",
    fontSize: 14,
  },
  stravaButton: {
    backgroundColor: "#fc4c02", // Strava orange
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  stravaButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  disclaimer: {
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
