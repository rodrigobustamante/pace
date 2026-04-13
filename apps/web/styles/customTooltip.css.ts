import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const root = style({
  background: vars.color.tooltipBg,
  border: `1px solid ${vars.color.borderHover}`,
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 12,
  color: vars.color.textSlate,
});

export const label = style({
  color: vars.color.foreground,
  marginBottom: 4,
  fontWeight: 600,
});
