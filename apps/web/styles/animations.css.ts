import { keyframes, style } from "@vanilla-extract/css";

export const spinKeyframes = keyframes({
  to: { transform: "rotate(360deg)" },
});

export const pulseKeyframes = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.4 },
});

export const pulseCoachKeyframes = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.5 },
});

export const fadeUpKeyframes = keyframes({
  from: { opacity: 0, transform: "translateY(18px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

export const blinkKeyframes = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0 },
});

export const spinAnimation = style({
  animation: `${spinKeyframes} 0.8s linear infinite`,
});

export const pulseAnimation = style({
  animation: `${pulseKeyframes} 1.5s ease-in-out infinite`,
});

export const pulseCoachAnimation = style({
  animation: `${pulseCoachKeyframes} 1.5s ease-in-out infinite`,
});

export const blinkCaret = style({
  animation: `${blinkKeyframes} 0.8s step-end infinite`,
});
