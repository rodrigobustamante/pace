import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { pulseCoachKeyframes, spinKeyframes } from "./animations.css";

export const pageHead = style({
  marginBottom: 28,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
});

export const pageTitle = style({
  fontSize: 32,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
});

export const pageSub = style({
  fontSize: 13,
  color: vars.color.muted,
  marginTop: 4,
});

export const accentOrange = style({
  color: vars.color.orange,
});

export const regenBtn = style({
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  transition: "all 0.2s",
});

export const regenBtnReady = style({
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorderStrong}`,
  color: vars.color.orange,
  cursor: "pointer",
});

export const regenBtnLoading = style({
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderSubtle}`,
  color: vars.color.muted,
  cursor: "not-allowed",
});

export const regenRow = style({
  display: "flex",
  alignItems: "center",
  gap: 6,
});

export const spinSm = style({
  width: 10,
  height: 10,
  border: `2px solid ${vars.color.muted}`,
  borderTopColor: vars.color.orange,
  borderRadius: "50%",
  display: "inline-block",
  animation: `${spinKeyframes} 0.8s linear infinite`,
});

export const dailyCard = style({
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
});

export const dailyCardTrain = style({
  background: "rgba(74,222,128,0.08)",
  border: "1px solid rgba(74,222,128,0.2)",
});

export const dailyCardRest = style({
  background: "rgba(96,165,250,0.08)",
  border: "1px solid rgba(96,165,250,0.2)",
});

export const dailyHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const dailyHeaderMb = style({
  marginBottom: 16,
});

export const dailyLabel = style({
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
});

export const dailyLabelTrain = style({
  color: vars.color.green,
});

export const dailyLabelRest = style({
  color: vars.color.blue,
});

export const iconBtn = style({
  background: "transparent",
  border: "none",
  color: vars.color.muted,
  fontSize: 12,
  cursor: "pointer",
  padding: "2px 6px",
  fontFamily: vars.font.dmSans,
});

export const loadRow = style({
  display: "flex",
  gap: 12,
  alignItems: "center",
});

export const spinLoader = style({
  width: 10,
  height: 10,
  border: `2px solid ${vars.color.slateDark}`,
  borderTopColor: vars.color.blue,
  borderRadius: "50%",
  flexShrink: 0,
  animation: `${spinKeyframes} 0.8s linear infinite`,
});

export const dailyBodyRow = style({
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
});

export const dailyIcon = style({
  fontSize: 32,
  flexShrink: 0,
});

export const dailyContent = style({
  flex: 1,
});

export const dailyTitle = style({
  fontSize: 15,
  fontWeight: 700,
  color: vars.color.foreground,
  marginBottom: 6,
});

export const dailyText = style({
  fontSize: 13,
  color: vars.color.textSlate,
  lineHeight: 1.7,
});

export const chipRow = style({
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
});

export const chipAccent = style({
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
  padding: "3px 8px",
  fontFamily: vars.font.dmMono,
});

export const chipMuted = style({
  fontSize: 11,
  color: vars.color.muted2,
  background: vars.color.overlayHover,
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: 6,
  padding: "3px 8px",
  fontFamily: vars.font.dmMono,
});

export const errorBanner = style({
  background: vars.color.errorBg,
  border: `1px solid ${vars.color.errorBorder}`,
  borderRadius: 12,
  padding: 16,
  color: vars.color.error,
  fontSize: 13,
  marginBottom: 20,
});

export const skeletonSummary = style({
  background:
    "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.04))",
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 16,
  padding: 24,
});

export const skeletonEmoji = style({
  fontSize: 36,
  animation: `${pulseCoachKeyframes} 1.5s ease-in-out infinite`,
});

export const skeletonLine = style({
  borderRadius: 4,
  animation: `${pulseCoachKeyframes} 1.5s ease-in-out infinite`,
});

export const weeklyBox = style({
  background:
    "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.05))",
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
});

export const weeklyRow = style({
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
});

export const weeklyEmoji = style({
  fontSize: 36,
  flexShrink: 0,
});

export const weeklyHeading = style({
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 10,
  color: vars.color.foreground,
});

export const weeklyText = style({
  fontSize: 13,
  color: vars.color.textSlate,
  lineHeight: 1.75,
  minHeight: 40,
});

export const footerNote = style({
  marginTop: 24,
  padding: "12px 20px",
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.border}`,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const footerMono = style({
  fontSize: 11,
  color: vars.color.slate,
  fontFamily: vars.font.dmMono,
});

export const chatSectionTitle = style({
  fontSize: 13,
  fontWeight: 700,
  color: vars.color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 12,
});

export const chatSection = style({
  marginTop: 32,
});

export const emptyCoach = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: 48,
  textAlign: "center",
  color: vars.color.muted,
});

// ─── Overtraining alert banner ────────────────────────────────────────────────

export const riskBanner = style({
  borderRadius: 12,
  padding: "14px 18px",
  marginBottom: 16,
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
});

export const riskBannerWarning = style({
  background: "rgba(251,191,36,0.08)",
  border: "1px solid rgba(251,191,36,0.25)",
});

export const riskBannerDanger = style({
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.3)",
});

export const riskIcon = style({
  fontSize: 18,
  flexShrink: 0,
  lineHeight: 1.4,
});

export const riskContent = style({
  flex: 1,
});

export const riskTitle = style({
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 4,
});

export const riskTitleWarning = style({
  color: "rgba(251,191,36,0.9)",
});

export const riskTitleDanger = style({
  color: "#f87171",
});

export const riskSignals = style({
  fontSize: 12,
  color: vars.color.muted2,
  lineHeight: 1.6,
});

// ─── Race projection card ─────────────────────────────────────────────────────

export const projectionCard = style({
  background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: 16,
  padding: 20,
  marginBottom: 24,
});

export const projectionHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
});

export const projectionLabel = style({
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "rgba(167,139,250,0.9)",
});

export const projectionRace = style({
  fontSize: 13,
  fontWeight: 600,
  color: vars.color.foreground,
  marginTop: 2,
});

export const projectionDays = style({
  fontSize: 11,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
});

export const projectionMetrics = style({
  display: "flex",
  gap: 24,
});

export const projectionMetric = style({
  display: "flex",
  flexDirection: "column",
  gap: 2,
});

export const projectionValue = style({
  fontSize: 24,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  lineHeight: 1,
});

export const projectionValuePositive = style({
  color: vars.color.green,
});

export const projectionValueNeutral = style({
  color: vars.color.orange,
});

export const projectionValueNegative = style({
  color: "#f87171",
});

export const projectionMetricLabel = style({
  fontSize: 10,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export const projectionFormBadge = style({
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
  padding: "3px 8px",
  marginTop: 12,
  display: "inline-block",
});

export const projectionFormGood = style({
  background: "rgba(74,222,128,0.12)",
  color: vars.color.green,
  border: "1px solid rgba(74,222,128,0.25)",
});

export const projectionFormOk = style({
  background: "rgba(249,115,22,0.12)",
  color: vars.color.orange,
  border: `1px solid ${vars.color.orangeBorder}`,
});

export const projectionFormBad = style({
  background: "rgba(239,68,68,0.1)",
  color: "#f87171",
  border: "1px solid rgba(239,68,68,0.25)",
});
