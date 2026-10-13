import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "./theme.css";

const mobile = "(max-width: 639px)";

const pulse = keyframes({
  "0%, 100%": { transform: "scale(1)", opacity: 1 },
  "50%": { transform: "scale(1.08)", opacity: 0.85 },
});

const ringPulse = keyframes({
  "0%": { transform: "scale(0.92)", opacity: 0.6 },
  "100%": { transform: "scale(1.4)", opacity: 0 },
});

export const card = style({
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.border}`,
  borderRadius: 16,
  padding: "20px 24px",
  display: "flex",
  alignItems: "center",
  gap: 24,
  overflow: "hidden",
  position: "relative",
  "@media": {
    [mobile]: {
      flexDirection: "column",
      gap: 16,
      padding: "16px",
      textAlign: "center",
    },
  },
});

export const glowLayer = style({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  borderRadius: 16,
  transition: "background 0.6s ease",
});

// ─── Animated figure area ───────────────────────────────────────────────────

export const figureWrap = style({
  flexShrink: 0,
  width: 120,
  height: 120,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "@media": {
    [mobile]: {
      width: 96,
      height: 96,
    },
  },
});

export const ring = style({
  position: "absolute",
  inset: 0,
  borderRadius: "50%",
  animation: `${ringPulse} 1.8s ease-out infinite`,
  border: "2px solid currentColor",
});

export const ring2 = style([
  ring,
  {
    animationDelay: "0.9s",
  },
]);

export const emoji = style({
  fontSize: 52,
  lineHeight: 1,
  animation: `${pulse} 2.4s ease-in-out infinite`,
  userSelect: "none",
  position: "relative",
  zIndex: 1,
  "@media": {
    [mobile]: {
      fontSize: 42,
    },
  },
});

// Rive canvas — same dimensions as figure area, hidden until a .riv is loaded
export const riveCanvas = style({
  width: 120,
  height: 120,
  "@media": {
    [mobile]: {
      width: 96,
      height: 96,
    },
  },
});

// ─── Info area ───────────────────────────────────────────────────────────────

export const info = style({
  flex: 1,
  minWidth: 0,
});

export const stateLabel = style({
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 4,
  fontFamily: vars.font.dmMono,
  transition: "color 0.4s ease",
});

export const tsbValue = style({
  fontSize: 40,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  letterSpacing: "-0.03em",
  lineHeight: 1,
  marginBottom: 4,
  transition: "color 0.4s ease",
  "@media": {
    [mobile]: {
      fontSize: 32,
    },
  },
});

export const tsbUnit = style({
  fontSize: 14,
  fontWeight: 400,
  opacity: 0.5,
  marginLeft: 4,
  fontFamily: vars.font.dmSans,
});

export const description = style({
  fontSize: 13,
  color: vars.color.textSlate,
  lineHeight: 1.5,
  marginTop: 6,
});

// ─── "Connect your .riv" hint ─────────────────────────────────────────────

export const hint = style({
  marginTop: 14,
  paddingTop: 14,
  borderTop: `1px dashed ${vars.color.border}`,
  fontSize: 11,
  color: vars.color.muted,
  display: "flex",
  alignItems: "center",
  gap: 6,
});

export const hintDot = style({
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: vars.color.muted,
  flexShrink: 0,
});
