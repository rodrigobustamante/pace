import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const root = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: 24,
});

export const kicker = style({
  fontSize: 12,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: vars.color.muted2,
  marginBottom: 4,
  fontFamily: vars.font.dmMono,
});

export const title = style({
  fontSize: 22,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 16,
});

export const zoneBlock = style({
  marginBottom: 10,
});

export const zoneHeader = style({
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 4,
  gap: 8,
});

export const zoneLeft = style({
  display: "flex",
  alignItems: "baseline",
  gap: 6,
  minWidth: 0,
});

export const zoneName = style({
  fontSize: 11,
  color: vars.color.textSlate,
  whiteSpace: "nowrap",
});

export const zoneNameMuted = style({
  color: vars.color.muted,
});

export const zoneBpm = style({
  fontSize: 10,
  color: vars.color.slate,
  fontFamily: vars.font.dmMono,
  whiteSpace: "nowrap",
});

export const zoneMeta = style({
  fontSize: 11,
  fontFamily: vars.font.dmMono,
  color: vars.color.textSlate,
  whiteSpace: "nowrap",
});

export const zoneMetaPct = style({
  color: vars.color.muted,
});

export const barTrack = style({
  height: 6,
  background: vars.color.overlayWhite06,
  borderRadius: 3,
  overflow: "hidden",
});

export const barFill = style({
  height: "100%",
  borderRadius: 3,
  transition: "width 0.8s ease",
});
