import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { fadeUpKeyframes } from "./animations.css";

const mobile = "(max-width: 639px)";

export const shellRoot = style({
  minHeight: "100vh",
  background: vars.color.background,
  color: vars.color.foreground,
  fontFamily: vars.font.dmSans,
  "@media": {
    [mobile]: {
      height: "100dvh",
      minHeight: "unset",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
  },
});

export const headerInner = style({
  padding: "0 32px",
  "@media": {
    [mobile]: {
      flexShrink: 0,
      position: "static",
      padding: "0 16px",
    },
  },
});

export const contentWrap = style({
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "32px 32px 0",
  width: "100%",
  "@media": {
    [mobile]: {
      flex: 1,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      padding: "20px 16px 24px",
    },
  },
});

export const headerNav = style({
  display: "flex",
  gap: 4,
  "@media": {
    [mobile]: {
      display: "none",
    },
  },
});

export const headerSync = style({
  "@media": {
    [mobile]: {
      display: "none",
    },
  },
});

export const bottomNav = style({
  display: "none",
  "@media": {
    [mobile]: {
      display: "flex",
      flexShrink: 0,
      position: "static",
    },
  },
});

export const rg4 = style({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 16,
  marginBottom: 28,
  "@media": {
    [mobile]: {
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 12,
      marginBottom: 20,
    },
  },
});

export const rg2 = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  "@media": {
    [mobile]: {
      gridTemplateColumns: "1fr",
    },
  },
});

export const rg21 = style({
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 20,
  marginBottom: 20,
  "@media": {
    [mobile]: {
      gridTemplateColumns: "1fr",
    },
  },
});

export const rg32 = style({
  display: "grid",
  gridTemplateColumns: "3fr 2fr",
  gap: 20,
  marginBottom: 20,
  "@media": {
    [mobile]: {
      gridTemplateColumns: "1fr",
    },
  },
});

export const rgInsight = style({
  gap: 16,
  marginBottom: 0,
  "@media": {
    [mobile]: {
      gridTemplateColumns: "1fr",
    },
  },
});

/** Coach grid: 2 columns with tighter gap (replaces rg-2 + rg-insight) */
export const rg2Insight = style([
  rg2,
  {
    gap: 16,
    marginBottom: 0,
  },
]);

const fadeUpBase = style({
  animation: `${fadeUpKeyframes} 0.5s ease forwards`,
});

export const fadeUp1 = style([
  fadeUpBase,
  { animationDelay: "0.05s", opacity: 0 },
]);

export const fadeUp2 = style([
  fadeUpBase,
  { animationDelay: "0.12s", opacity: 0 },
]);

export const fadeUp3 = style([
  fadeUpBase,
  { animationDelay: "0.19s", opacity: 0 },
]);

export const fadeUp4 = style([
  fadeUpBase,
  { animationDelay: "0.26s", opacity: 0 },
]);

export const fadeUp5 = style([
  fadeUpBase,
  { animationDelay: "0.33s", opacity: 0 },
]);

export const heroTitle = style({
  fontSize: 40,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  letterSpacing: "-0.02em",
  "@media": {
    [mobile]: {
      fontSize: 26,
      letterSpacing: "-0.01em",
    },
  },
});

export const actStatsFull = style({
  display: "flex",
  gap: 32,
  textAlign: "right",
  "@media": {
    [mobile]: {
      display: "none",
    },
  },
});

export const actStatsMini = style({
  display: "none",
  textAlign: "right",
  gap: 16,
  "@media": {
    [mobile]: {
      display: "flex",
    },
  },
});

export const actExpandGrid = style({
  gridTemplateColumns: "repeat(4, 1fr)",
  "@media": {
    [mobile]: {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
});

export const coachBannerInner = style({
  display: "flex",
  alignItems: "center",
  gap: 16,
  "@media": {
    [mobile]: {
      flexDirection: "column",
      gap: 12,
    },
  },
});

export const coachBannerBtn = style({
  marginLeft: "auto",
  whiteSpace: "nowrap",
  "@media": {
    [mobile]: {
      marginLeft: 0,
    },
  },
});
