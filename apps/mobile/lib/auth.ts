import * as SecureStore from "expo-secure-store";

const KEYS = {
  accessToken: "pace_access_token",
  refreshToken: "pace_refresh_token",
  userId: "pace_user_id",
} as const;

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
  userId: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    SecureStore.setItemAsync(KEYS.userId, userId),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.accessToken);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function getStoredUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.userId);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.userId),
  ]);
}
