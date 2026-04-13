import { createVar, style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

/** Border color including alpha (e.g. `#fb923c40`) — set from TS per type */
export const borderColorVar = createVar();
export const glowVar = createVar();
export const titleColorVar = createVar();

export const root = style({
  vars: {
    [borderColorVar]: `${vars.color.orange}40`,
    [glowVar]: "rgba(251,146,60,0.15)",
    [titleColorVar]: vars.color.orange,
  },
  background: glowVar,
  border: `1px solid ${borderColorVar}`,
  borderRadius: 16,
  padding: 24,
  transition: "transform 0.2s ease",
  ":hover": {
    transform: "translateY(-2px)",
  },
});

export const row = style({
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
});

export const icon = style({
  fontSize: 28,
  flexShrink: 0,
});

export const title = style({
  fontSize: 14,
  fontWeight: 700,
  color: titleColorVar,
  marginBottom: 6,
});

export const body = style({
  fontSize: 13,
  color: vars.color.textSlate,
  lineHeight: 1.6,
});
