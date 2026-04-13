import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const row = style({
  borderRadius: 12,
  padding: "16px 20px",
  transition: "all 0.15s",
  cursor: "pointer",
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.border}`,
  ":hover": {
    background: "rgba(255,255,255,0.04)",
  },
  selectors: {
    '&[data-expanded="true"]': {
      background: vars.color.overlayWhite06,
      border: `1px solid ${vars.color.orangeBorderStrong}`,
    },
  },
});

export const rowInner = style({
  display: "flex",
  alignItems: "center",
  gap: 16,
});

export const typeIcon = style({
  width: 40,
  height: 40,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  flexShrink: 0,
});

export const mainCol = style({
  flex: 1,
  minWidth: 0,
});

export const titleRow = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 2,
});

export const title = style({
  fontSize: 14,
  fontWeight: 600,
  color: vars.color.foreground,
});

export const typeBadge = style({
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 20,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
});

export const dateLine = style({
  fontSize: 11,
  color: vars.color.muted,
});

export const statCol = style({
  minWidth: 70,
});

export const statValue = style({
  fontSize: 15,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.foreground,
});

export const statValueSm = style({
  fontSize: 14,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  color: vars.color.foreground,
});

export const statLabel = style({
  fontSize: 10,
  color: vars.color.muted,
  letterSpacing: "0.06em",
});

export const feelDots = style({
  display: "flex",
  gap: 2,
});

export const feelDot = style({
  width: 6,
  height: 6,
  borderRadius: 2,
});

export const feelLabel = style({
  fontSize: 10,
  color: vars.color.muted,
  marginTop: 2,
});

export const expandSection = style({
  marginTop: 16,
  paddingTop: 16,
  borderTop: `1px solid ${vars.color.border}`,
  display: "grid",
  gap: 12,
});

export const expandCell = style({
  background: vars.color.overlayMed,
  borderRadius: 8,
  padding: "10px 14px",
});

export const expandValue = style({
  fontSize: 16,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
});

export const expandLabel = style({
  fontSize: 10,
  color: vars.color.muted,
  marginTop: 2,
});
