import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const panel = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  textAlign: "center",
});

export const panelEditing = style([
  panel,
  { gap: 16 },
]);

export const emoji = style({
  fontSize: 28,
});

export const labelCaps = style({
  fontSize: 11,
  color: vars.color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 4,
});

export const valueLarge = style({
  fontSize: 36,
  fontWeight: 800,
  fontFamily: vars.font.barlow,
  color: vars.color.foreground,
  lineHeight: 1,
});

export const valueUnit = style({
  fontSize: 16,
  color: vars.color.muted,
  fontWeight: 400,
});

export const titleMd = style({
  fontSize: 14,
  fontWeight: 600,
  color: vars.color.foreground,
  marginBottom: 4,
});

export const help = style({
  fontSize: 12,
  color: vars.color.muted,
  lineHeight: 1.5,
});

export const ghostBtn = style({
  background: "transparent",
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: 6,
  color: vars.color.muted,
  fontSize: 12,
  padding: "4px 12px",
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  textDecoration: "none",
});

export const formRow = style({
  display: "flex",
  gap: 8,
  width: "100%",
  maxWidth: 220,
});

export const input = style({
  flex: 1,
  background: vars.color.overlayHoverStrong,
  border: `1px solid ${vars.color.borderHover}`,
  borderRadius: 8,
  padding: "8px 12px",
  color: vars.color.foreground,
  fontSize: 14,
  fontFamily: vars.font.dmMono,
  outline: "none",
  width: 0,
});

export const submitBtn = style({
  background: "rgba(249,115,22,0.2)",
  border: `1px solid ${vars.color.orangeBorderStrong}`,
  borderRadius: 8,
  padding: "8px 14px",
  color: vars.color.orange,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  whiteSpace: "nowrap",
});

export const submitBtnDisabled = style({
  cursor: "not-allowed",
  opacity: 0.6,
});

export const cancelBtn = style({
  background: "transparent",
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: 8,
  padding: "8px 10px",
  color: vars.color.muted,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
});

export const errorText = style({
  fontSize: 12,
  color: vars.color.error,
});
