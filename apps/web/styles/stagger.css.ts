import { style } from "@vanilla-extract/css";

export const reveal = style({
  opacity: 0,
  transform: "translateY(16px)",
  transition: "opacity 0.4s ease, transform 0.4s ease",
  selectors: {
    '&[data-visible="true"]': {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
});
