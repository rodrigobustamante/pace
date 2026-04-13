import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { pulseKeyframes } from "./animations.css";

export const root = style({
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  animation: `${pulseKeyframes} 1.5s ease-in-out infinite`,
});
