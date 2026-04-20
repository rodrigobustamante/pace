import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

// ─── Heatmap ─────────────────────────────────────────────────────────────────

export const heatmapSection = style({
  marginBottom: 32,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
});

export const heatmapGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(53, 1fr)",
  gap: 3,
  overflowX: "auto",
});

export const heatmapCell = style({
  width: 12,
  height: 12,
  borderRadius: 2,
  flexShrink: 0,
});

export const heatmapMonthLabels = style({
  display: "flex",
  marginBottom: 4,
});

export const heatmapMonthLabel = style({
  fontSize: 10,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
});

export const heatmapDayLabels = style({
  display: "flex",
  flexDirection: "column",
  gap: 3,
  marginRight: 6,
  justifyContent: "flex-start",
  fontSize: 10,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
  paddingTop: 16,
});

export const heatmapLegend = style({
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginTop: 8,
  fontSize: 10,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
});

export const heatmapLegendCell = style({
  width: 10,
  height: 10,
  borderRadius: 2,
  flexShrink: 0,
});

export const heatmapWrap = style({
  display: "flex",
  alignItems: "flex-start",
  overflowX: "auto",
});

export const heatmapTooltip = style({
  position: "fixed",
  pointerEvents: "none",
  zIndex: 999,
  background: "#0f172a",
  border: `1px solid ${vars.color.border}`,
  borderRadius: 8,
  padding: "8px 12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  minWidth: 140,
  userSelect: "none",
});

export const heatmapTooltipDate = style({
  fontSize: 11,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
  marginBottom: 4,
  textTransform: "capitalize",
});

export const heatmapTooltipKm = style({
  fontSize: 20,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.orange,
  lineHeight: 1,
  marginBottom: 4,
});

export const heatmapTooltipEmpty = style({
  fontSize: 12,
  color: vars.color.muted,
  fontFamily: vars.font.dmSans,
});

export const heatmapTooltipMeta = style({
  fontSize: 11,
  color: vars.color.muted2,
  fontFamily: vars.font.dmMono,
});

export const heatmapSkeletonRow = style({
  display: "flex",
  gap: 3,
});

// ─── Personal Records ────────────────────────────────────────────────────────

export const prGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 12,
  "@media": {
    "screen and (min-width: 480px)": { gridTemplateColumns: "repeat(3, 1fr)" },
    "screen and (min-width: 640px)": { gridTemplateColumns: "repeat(5, 1fr)" },
  },
});

export const prCard = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 12,
  padding: 16,
});

export const prDistance = style({
  fontSize: 13,
  fontWeight: 700,
  color: vars.color.orange,
  fontFamily: vars.font.dmMono,
  marginBottom: 4,
});

export const prTime = style({
  fontSize: 28,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.foreground,
  lineHeight: 1,
});

export const prPace = style({
  fontSize: 12,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
  marginTop: 4,
});

export const prDate = style({
  fontSize: 11,
  color: vars.color.muted,
  marginTop: 6,
});

export const prEmpty = style({
  fontSize: 28,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.muted,
  lineHeight: 1,
});

// ─── Annual Stats ────────────────────────────────────────────────────────────

export const annualGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(1, 1fr)",
  gap: 12,
  marginBottom: 24,
  "@media": {
    "screen and (min-width: 480px)": { gridTemplateColumns: "repeat(3, 1fr)" },
    "screen and (min-width: 640px)": { gridTemplateColumns: "repeat(5, 1fr)" },
  },
});

/** Makes the lone last card span full-width when it falls in a 2-col row */
export const annualStatLast = style({
  "@media": {
    "screen and (max-width: 479px)": { gridColumn: "1 / -1" },
  },
});

export const annualStat = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 12,
  padding: 16,
});

export const annualValue = style({
  fontSize: 32,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.foreground,
  lineHeight: 1,
  "@media": {
    "screen and (max-width: 479px)": { fontSize: 28 },
  },
});

export const annualLabel = style({
  fontSize: 11,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginTop: 4,
});

// ─── Streak ──────────────────────────────────────────────────────────────────

export const streakRow = style({
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginBottom: 24,
  "@media": {
    "screen and (min-width: 480px)": { flexDirection: "row" },
  },
});

export const streakCard = style({
  flex: 1,
  padding: 16,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 12,
  background: vars.color.overlayLight,
  textAlign: "center",
});

export const streakNumber = style({
  fontSize: 40,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.orange,
});

export const streakLabel = style({
  fontSize: 11,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
  textTransform: "uppercase",
});

export const streakFire = style({
  fontSize: 20,
  marginBottom: 4,
});

// ─── Section Blocks ──────────────────────────────────────────────────────────

export const sectionBlock = style({
  marginBottom: 24,
  "@media": {
    "screen and (min-width: 640px)": { marginBottom: 28 },
  },
});

export const sectionHeading = style({
  fontSize: 15,
  fontWeight: 700,
  color: vars.color.foreground,
  marginBottom: 4,
});

export const sectionSub = style({
  fontSize: 12,
  color: vars.color.muted,
  marginBottom: 16,
});
