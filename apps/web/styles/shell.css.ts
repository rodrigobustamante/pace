import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

const mobile = "(max-width: 639px)";

export const headerBar = style({
  borderBottom: `1px solid ${vars.color.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: 64,
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: vars.color.headerBg,
  backdropFilter: "blur(16px)",
  "@media": {
    [mobile]: {
      flexShrink: 0,
      position: "static",
    },
  },
});

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: 12,
});

export const logoIcon = style({
  width: 32,
  height: 32,
  borderRadius: 8,
  background: `linear-gradient(135deg, ${vars.color.orangeDark}, ${vars.color.red})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
});

export const brandTitle = style({
  fontSize: 15,
  fontWeight: 600,
  fontFamily: vars.font.barlow,
  letterSpacing: "0.04em",
});

export const brandSubtitle = style({
  fontSize: 10,
  color: vars.color.muted,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
});

export const tabBtn = style({
  padding: "6px 16px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: vars.color.muted2,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  transition: "all 0.15s",
  borderBottom: "2px solid transparent",
  textDecoration: "none",
  display: "inline-block",
  ":hover": {
    background: "rgba(255,255,255,0.06)",
  },
});

export const tabBtnActive = style({
  background: vars.color.orangeGlow,
  color: vars.color.orange,
  borderBottom: `2px solid ${vars.color.orange}`,
});

export const headerRight = style({
  display: "flex",
  alignItems: "center",
  gap: 10,
});

export const syncRow = style({
  display: "flex",
  alignItems: "center",
  gap: 10,
});

export const syncDot = style({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: vars.color.green,
  boxShadow: `0 0 8px ${vars.color.green}`,
});

export const syncLabel = style({
  fontSize: 12,
  color: vars.color.muted,
});

export const settingsLink = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1px solid ${vars.color.borderStrong}`,
  fontSize: 15,
  textDecoration: "none",
});

export const settingsLinkInactive = style({
  color: vars.color.muted,
  background: "transparent",
});

export const settingsLinkActive = style({
  color: vars.color.orange,
  background: vars.color.orangeGlow,
});

export const avatar = style({
  width: 32,
  height: 32,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  overflow: "hidden",
});

export const avatarPlaceholder = style({
  background: `linear-gradient(135deg, ${vars.color.avatarGradientFrom}, ${vars.color.avatarGradientTo})`,
});

export const avatarImg = style({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export const logoutBtn = style({
  background: "transparent",
  border: `1px solid ${vars.color.borderStrong}`,
  borderRadius: 6,
  color: vars.color.muted,
  fontSize: 12,
  padding: "4px 10px",
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
});

export const bottomNavBar = style({
  background: vars.color.bottomNavBg,
  borderTop: `1px solid ${vars.color.bottomNavBorder}`,
  justifyContent: "space-around",
  alignItems: "stretch",
  height: 64,
  paddingBottom: "env(safe-area-inset-bottom)",
});

export const bottomNavLink = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 3,
  flex: 1,
  textDecoration: "none",
  transition: "color 0.15s",
  paddingTop: 2,
  color: vars.color.muted,
  borderTop: "2px solid transparent",
  selectors: {
    '&[data-active="true"]': {
      color: vars.color.orange,
      borderTop: `2px solid ${vars.color.orange}`,
    },
  },
});

export const bottomNavIcon = style({
  fontSize: 20,
});

export const bottomNavLabel = style({
  fontSize: 10,
  fontWeight: 600,
  fontFamily: vars.font.dmSans,
  letterSpacing: "0.04em",
});
