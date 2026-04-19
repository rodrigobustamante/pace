import * as SecureStore from "expo-secure-store";

const USER_ID_KEY = "pace_user_id";

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function saveUserId(userId: string): Promise<void> {
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
}

export async function clearUserId(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const id = await getUserId();
  return id !== null && id.length > 0;
}
