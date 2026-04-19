import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from "react-native";
import * as Linking2 from "expo-linking";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { saveUserId } from "@/lib/auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function AuthScreen() {
  const router = useRouter();

  // Handle deep link callback: pace://auth?userId=<id>
  useEffect(() => {
    const subscription = Linking2.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // Handle case where app was opened via deep link
    Linking2.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  async function handleDeepLink(url: string) {
    const parsed = Linking2.parse(url);
    if (parsed.scheme === "pace" && parsed.path === "auth" && parsed.queryParams?.userId) {
      const userId = parsed.queryParams.userId as string;
      await saveUserId(userId);
      router.replace("/(tabs)");
    }
  }

  function handleStravaLogin() {
    const callbackUrl = Linking2.createURL("auth");
    const authUrl = `${API_URL}/api/strava/auth?platform=mobile&redirect=${encodeURIComponent(callbackUrl)}`;
    Linking.openURL(authUrl);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("@/assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>PACE</Text>
        <Text style={styles.subtitle}>Running Analytics</Text>

        <Text style={styles.desc}>
          Conecta tu cuenta de Strava para ver tu historial, métricas avanzadas
          y recibir coaching personalizado con IA.
        </Text>

        <TouchableOpacity style={styles.stravaBtn} onPress={handleStravaLogin}>
          <Text style={styles.stravaBtnText}>Conectar con Strava</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060d1a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#f1f5f9",
    letterSpacing: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 40,
  },
  desc: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  stravaBtn: {
    width: "100%",
    backgroundColor: "#fc5200",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  stravaBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
