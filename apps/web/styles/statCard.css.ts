import { createVar, style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const accentVar = createVar();

export const root = style({
  vars: {
    [accentVar]: vars.color.orange,
  },
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: "20px 24px",
  position: "relative",
  overflow: "hidden",
  selectors: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: accentVar,
      borderRadius: "16px 16px 0 0",
    },
  },
});

export const label = style({
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: vars.color.muted2,
  marginBottom: 8,
  fontFamily: vars.font.dmMono,
});

export const value = style({
  fontSize: 32,
  fontWeight: 700,
  color: vars.color.foreground,
  fontFamily: vars.font.barlow,
  lineHeight: 1,
});

export const sub = style({
  fontSize: 12,
  color: vars.color.muted,
  marginTop: 6,
});
