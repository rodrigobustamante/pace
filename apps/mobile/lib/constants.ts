export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://pace-web.vercel.app";

export const DEEP_LINK_SCHEME = "pace";

/** Colors matching the web design system */
export const COLORS = {
  bg: "#060d1a",
  surface: "#0f172a",
  border: "#1e293b",
  accent: "#f97316",  // orange
  green: "#4ade80",
  blue: "#60a5fa",
  red: "#f87171",
  amber: "#fbbf24",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textDim: "#475569",
} as const;

export const FONTS = {
  mono: "DM Mono",
  sans: "DM Sans",
} as const;
