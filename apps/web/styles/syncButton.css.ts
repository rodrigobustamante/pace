import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { spinKeyframes } from "./animations.css";

export const syncSpinner = style({
  width: 12,
  height: 12,
  border: `2px solid ${vars.color.slate}`,
  borderTopColor: vars.color.strava,
  borderRadius: "50%",
  display: "inline-block",
  animation: `${spinKeyframes} 0.8s linear infinite`,
});

export const sectionLabel = style({
  fontSize: 11,
  fontWeight: 600,
  color: vars.color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 12,
});

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
});

export const syncBtn = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 18px",
  borderRadius: 10,
  border: "1px solid",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: vars.font.dmSans,
  transition: "all 0.2s",
});

export const syncBtnReady = style({
  borderColor: vars.color.stravaBorder,
  background: vars.color.stravaBg,
  color: vars.color.strava,
  cursor: "pointer",
});

export const syncBtnIdle = style({
  borderColor: vars.color.borderStrong,
  background: vars.color.overlayMed,
  color: vars.color.slate,
  cursor: "not-allowed",
});

export const meta = style({
  fontSize: 12,
  color: vars.color.slate,
  fontFamily: vars.font.dmMono,
});

export const metaHighlight = style({
  color: vars.color.muted,
});

export const footnote = style({
  marginTop: 8,
  fontSize: 11,
  color: vars.color.slateDark,
});

export const checkGreen = style({
  color: vars.color.green,
});
