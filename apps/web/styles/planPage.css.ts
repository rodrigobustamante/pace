import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { pulseCoachKeyframes, spinKeyframes } from "./animations.css";

// ── Page header ──────────────────────────────────────────────────────────────

export const pageHead = style({
  marginBottom: 28,
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

// ── Goal form ─────────────────────────────────────────────────────────────────

export const formCard = style({
  background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.04))",
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 20,
  padding: 32,
  maxWidth: 520,
});

export const formTitle = style({
  fontSize: 20,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 6,
});

export const formSub = style({
  fontSize: 13,
  color: vars.color.muted,
  marginBottom: 28,
  lineHeight: 1.6,
});

export const formGroup = style({
  marginBottom: 20,
});

export const formLabel = style({
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: vars.color.muted2,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 8,
  fontFamily: vars.font.dmSans,
});

export const formInput = style({
  width: "100%",
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  color: vars.color.foreground,
  fontFamily: vars.font.dmSans,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  ":focus": {
    borderColor: vars.color.orangeBorderStrong,
  },
  "::placeholder": {
    color: vars.color.muted,
  },
});

export const goalTypeGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
});

export const goalTypeBtn = style({
  padding: "12px 10px",
  borderRadius: 10,
  border: `1px solid ${vars.color.borderStrong}`,
  background: vars.color.overlayMed,
  color: vars.color.muted2,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  textAlign: "center",
  transition: "all 0.15s",
  ":hover": {
    background: vars.color.overlayHover,
    borderColor: vars.color.borderHover,
  },
});

export const goalTypeBtnActive = style({
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorderStrong}`,
  color: vars.color.orange,
});

export const submitBtn = style({
  width: "100%",
  padding: "12px 20px",
  borderRadius: 10,
  border: "none",
  background: `linear-gradient(135deg, ${vars.color.orangeDark}, ${vars.color.red})`,
  color: vars.color.white,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  marginTop: 8,
  transition: "opacity 0.15s",
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

export const formError = style({
  background: vars.color.errorBg,
  border: `1px solid ${vars.color.errorBorder}`,
  borderRadius: 10,
  padding: "12px 16px",
  color: vars.color.error,
  fontSize: 13,
  marginTop: 16,
});

// ── Generating state ──────────────────────────────────────────────────────────

export const generatingBox = style({
  background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(239,68,68,0.04))",
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 20,
  padding: 48,
  textAlign: "center",
  maxWidth: 400,
});

export const generatingEmoji = style({
  fontSize: 48,
  marginBottom: 16,
  animation: `${pulseCoachKeyframes} 1.5s ease-in-out infinite`,
});

export const generatingTitle = style({
  fontSize: 18,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 8,
});

export const generatingText = style({
  fontSize: 13,
  color: vars.color.muted,
  lineHeight: 1.6,
});

export const spinLoader = style({
  width: 20,
  height: 20,
  border: `3px solid ${vars.color.slateDark}`,
  borderTopColor: vars.color.orange,
  borderRadius: "50%",
  animation: `${spinKeyframes} 0.8s linear infinite`,
  margin: "16px auto 0",
});

// ── Plan header ───────────────────────────────────────────────────────────────

export const planHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: 24,
  flexWrap: "wrap",
  gap: 12,
});

export const goalBadge = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 10,
  padding: "8px 14px",
  marginBottom: 12,
});

export const goalBadgeLabel = style({
  fontSize: 12,
  fontWeight: 700,
  color: vars.color.orange,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: vars.font.dmMono,
});

export const goalTitle = style({
  fontSize: 26,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 4,
});

export const goalDate = style({
  fontSize: 13,
  color: vars.color.muted,
});

export const planHeaderActions = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
});

export const regeneratePlanBtn = style({
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 8,
  color: vars.color.orange,
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 12px",
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  transition: "all 0.15s",
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  ":hover": {
    borderColor: vars.color.orangeBorderStrong,
  },
});

export const deleteGoalBtn = style({
  background: "transparent",
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: 8,
  color: vars.color.muted,
  fontSize: 12,
  padding: "6px 12px",
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  transition: "all 0.15s",
  ":hover": {
    borderColor: vars.color.red,
    color: vars.color.red,
  },
});

export const executionRuleBanner = style({
  background: "rgba(96,165,250,0.1)",
  border: `1px solid rgba(96,165,250,0.35)`,
  borderRadius: 10,
  color: vars.color.textSlate,
  fontSize: 12,
  lineHeight: 1.6,
  padding: "10px 12px",
  marginBottom: 16,
});

export const zonesCard = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.border}`,
  borderRadius: 12,
  padding: "12px 14px",
  marginBottom: 16,
});

export const zonesTitle = style({
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: vars.color.muted2,
  marginBottom: 10,
  fontFamily: vars.font.dmMono,
});

export const zonesGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 8,
});

export const zoneItem = style({
  fontSize: 12,
  color: vars.color.textSlate,
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 8,
  padding: "8px 10px",
  lineHeight: 1.5,
});

export const zoneItemZ1 = style({
  background: "rgba(148,163,184,0.14)",
  border: "1px solid rgba(148,163,184,0.35)",
  color: vars.color.muted2,
});

export const zoneItemZ2 = style({
  background: "rgba(74,222,128,0.14)",
  border: "1px solid rgba(74,222,128,0.35)",
  color: vars.color.green,
});

export const zoneItemZ3 = style({
  background: "rgba(250,204,21,0.14)",
  border: "1px solid rgba(250,204,21,0.35)",
  color: vars.color.yellow,
});

export const zoneItemZ4 = style({
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.35)",
  color: vars.color.orange,
});

export const zoneItemZ5 = style({
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: vars.color.red,
});

export const zonesHint = style({
  fontSize: 12,
  color: vars.color.muted,
  lineHeight: 1.6,
});

// ── Week section ──────────────────────────────────────────────────────────────

export const weekSection = style({
  marginBottom: 32,
});

export const weekLabel = style({
  fontSize: 11,
  fontWeight: 700,
  color: vars.color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontFamily: vars.font.dmMono,
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: `1px solid ${vars.color.border}`,
});

export const daysGrid = style({
  display: "flex",
  flexDirection: "column",
  gap: 10,
});

// ── Day card ──────────────────────────────────────────────────────────────────

export const dayCard = style({
  borderRadius: 14,
  padding: "16px 20px",
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
  transition: "border-color 0.15s",
});

export const dayCardDefault = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.border}`,
});

export const dayCardTrain = style({
  background: "rgba(74,222,128,0.06)",
  border: "1px solid rgba(74,222,128,0.2)",
});

export const dayCardSkip = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  opacity: 0.6,
});

export const dayCardRace = style({
  background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.06))",
  border: `1px solid ${vars.color.orangeBorderStrong}`,
});

export const dayCardRest = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.border}`,
  opacity: 0.7,
});

export const dayDateCol = style({
  flexShrink: 0,
  width: 52,
  textAlign: "center",
});

export const dayDateNum = style({
  fontSize: 22,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  lineHeight: 1,
});

export const dayDateMon = style({
  fontSize: 10,
  fontWeight: 600,
  color: vars.color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: vars.font.dmMono,
  marginTop: 2,
});

export const dayIconCol = style({
  flexShrink: 0,
  fontSize: 24,
  paddingTop: 2,
});

export const dayContent = style({
  flex: 1,
  minWidth: 0,
});

export const dayTitleRow = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 4,
  flexWrap: "wrap",
});

export const dayTitle = style({
  fontSize: 14,
  fontWeight: 700,
  color: vars.color.foreground,
});

export const dayTypePill = style({
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 6,
  padding: "2px 7px",
  fontFamily: vars.font.dmMono,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  flexShrink: 0,
});

export const dayTypePillEasy = style({
  background: "rgba(74,222,128,0.12)",
  color: vars.color.green,
});

export const dayTypePillTempo = style({
  background: "rgba(250,204,21,0.12)",
  color: vars.color.yellow,
});

export const dayTypePillLong = style({
  background: "rgba(96,165,250,0.12)",
  color: vars.color.blue,
});

export const dayTypePillWorkout = style({
  background: "rgba(232,121,249,0.12)",
  color: vars.color.purple,
});

export const dayTypePillRace = style({
  background: vars.color.orangeGlow,
  color: vars.color.orange,
});

export const dayTypePillRest = style({
  background: vars.color.overlayHover,
  color: vars.color.muted,
});

export const dayDesc = style({
  fontSize: 12,
  color: vars.color.textSlate,
  lineHeight: 1.6,
  marginBottom: 10,
});

export const dayDuration = style({
  fontSize: 11,
  color: vars.color.muted2,
  fontFamily: vars.font.dmMono,
  marginBottom: 10,
});

export const dayTargets = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 10,
});

export const dayTargetItem = style({
  fontSize: 11,
  color: vars.color.orange,
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: vars.font.dmMono,
});

export const dayPriorityHint = style({
  fontSize: 11,
  color: vars.color.blue,
  lineHeight: 1.5,
  marginBottom: 10,
});

export const toggleRow = style({
  display: "flex",
  gap: 8,
});

export const toggleBtn = style({
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 7,
  padding: "5px 10px",
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  border: `1px solid ${vars.color.borderStrong}`,
  background: "transparent",
  color: vars.color.muted,
  transition: "all 0.15s",
  ":hover": {
    background: vars.color.overlayHover,
  },
});

export const toggleBtnYes = style({
  background: "rgba(74,222,128,0.12)",
  border: "1px solid rgba(74,222,128,0.3)",
  color: vars.color.green,
});

export const toggleBtnNo = style({
  background: vars.color.errorBg,
  border: `1px solid ${vars.color.errorBorder}`,
  color: vars.color.error,
});

export const todayBadge = style({
  fontSize: 10,
  fontWeight: 700,
  color: vars.color.orange,
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 5,
  padding: "2px 6px",
  fontFamily: vars.font.dmMono,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
});
