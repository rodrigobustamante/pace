import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuthStore } from "@/store/auth";
import { getAccessToken, getStoredUserId } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

async function registerPushToken() {
  if (!Device.isDevice) return;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await apiFetch("/api/user/push-token", {
    method: "POST",
    body: JSON.stringify({ token: token.data }),
  });
}

export default function RootLayout() {
  const { isHydrated, isAuthenticated, hydrate, markHydrated } = useAuthStore();

  useEffect(() => {
    async function boot() {
      try {
        const [token, userId] = await Promise.all([
          getAccessToken(),
          getStoredUserId(),
        ]);
        if (token && userId) {
          hydrate(userId, token);
        } else {
          markHydrated();
        }
      } catch {
        markHydrated();
      }
    }
    void boot();
  }, [hydrate, markHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    SplashScreen.hideAsync();

    if (isAuthenticated) {
      router.replace("/(tabs)/");
      void registerPushToken();
    } else {
      router.replace("/auth");
    }
  }, [isHydrated, isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
