import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const heroMeta = style({
  fontSize: 11,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: vars.color.muted,
  marginBottom: 6,
  fontFamily: vars.font.dmMono,
});

export const heroBlock = style({
  marginBottom: 28,
});

export const accentOrange = style({
  color: vars.color.orange,
});

export const coachBanner = style({
  background: "rgba(249,115,22,0.08)",
  border: `1px solid ${vars.color.orangeBorder}`,
  borderRadius: 16,
  padding: "16px 24px",
});

export const coachBannerRow = style({
  display: "flex",
  alignItems: "center",
  gap: 16,
});

export const coachBannerTitle = style({
  fontSize: 13,
  fontWeight: 600,
  color: vars.color.orange,
  marginBottom: 2,
});

export const coachBannerBody = style({
  fontSize: 13,
  color: vars.color.textSlate,
  lineHeight: 1.5,
});

export const coachCtaLink = style({
  background: "rgba(249,115,22,0.2)",
  border: `1px solid ${vars.color.orangeBorderStrong}`,
  borderRadius: 8,
  padding: "8px 16px",
  color: vars.color.orange,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  textDecoration: "none",
  display: "inline-block",
});

export const pageHeaderBlock = style({
  marginBottom: 24,
});

export const pageTitle = style({
  fontSize: 32,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  "@media": {
    "(max-width: 479px)": { fontSize: 26 },
  },
});

export const pageSubtitle = style({
  fontSize: 13,
  color: vars.color.muted,
  marginTop: 4,
});

export const flexColGap8 = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export const flexColGap16 = style({
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

export const flex1 = style({
  flex: 1,
});

export const emoji28 = style({
  fontSize: 28,
});

export const emptyState = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: 40,
  textAlign: "center",
  color: vars.color.muted,
});

export const emptyStateLarge = style({
  padding: 48,
});

export const emptyStateEmoji = style({
  fontSize: 48,
  marginBottom: 16,
});

export const emptyStateEmojiLg = style({
  fontSize: 56,
  marginBottom: 16,
});

export const emptyStateTitle = style({
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 8,
});

export const emptyStateTitleLg = style({
  fontSize: 18,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 8,
  color: vars.color.muted2,
});

export const emptyStateBody = style({
  fontSize: 13,
});

export const mutedText13 = style({
  fontSize: 13,
  color: vars.color.muted,
});

export const errorText13 = style({
  fontSize: 13,
  color: vars.color.error,
});

export const emptyStateBodyNarrow = style({
  fontSize: 13,
  maxWidth: 320,
  margin: "0 auto",
});

export const paginationRow = style({
  display: "flex",
  justifyContent: "center",
  gap: 8,
  marginTop: 24,
});

export const paginationBtn = style({
  padding: "8px 16px",
  borderRadius: 8,
  border: `1px solid ${vars.color.borderHover}`,
  fontSize: 13,
  fontFamily: vars.font.dmSans,
});

export const paginationBtnActive = style({
  background: vars.color.overlayHoverStrong,
  color: vars.color.textSlate,
  cursor: "pointer",
});

export const paginationBtnDisabled = style({
  background: vars.color.overlayLight,
  color: vars.color.slate,
  cursor: "not-allowed",
});

export const paginationPage = style({
  padding: "8px 16px",
  fontSize: 13,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
});

export const cardSubtle = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: 24,
});

export const sectionLabel = style({
  fontSize: 11,
  fontWeight: 600,
  color: vars.color.textSlate,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
});

export const sectionTitleSm = style({
  fontSize: 24,
  fontWeight: 800,
  fontFamily: vars.font.barlow,
  marginBottom: 20,
});

export const predictionRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 0",
  borderBottom: `1px solid ${vars.color.overlayLight}`,
});

export const predictionLeft = style({
  display: "flex",
  alignItems: "center",
  gap: 12,
});

export const predictionBadge = style({
  width: 40,
  height: 40,
  borderRadius: 8,
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorder}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  color: vars.color.orange,
  fontFamily: vars.font.barlow,
});

export const predictionHint = style({
  fontSize: 12,
  color: vars.color.muted2,
});

export const predictionTime = style({
  fontSize: 22,
  fontWeight: 800,
  fontFamily: vars.font.barlow,
  color: vars.color.foreground,
});

export const maxWidth480 = style({
  maxWidth: 480,
});

export const settingsSectionHeader = style({
  marginBottom: 28,
});

export const settingsCard = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  overflow: "hidden",
  marginBottom: 16,
});

export const settingsRow = style({
  padding: "20px 24px",
  borderBottom: `1px solid ${vars.color.border}`,
  display: "flex",
  alignItems: "center",
  gap: 14,
});

export const settingsRowLast = style({
  padding: "20px 24px",
});

export const settingsRowBorderTop = style({
  padding: "20px 24px",
  borderTop: `1px solid ${vars.color.border}`,
});

export const settingsAvatarImg = style({
  width: 48,
  height: 48,
  borderRadius: "50%",
  objectFit: "cover",
});

export const settingsAvatarPlaceholder = style({
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: `linear-gradient(135deg, ${vars.color.avatarGradientFrom}, ${vars.color.avatarGradientTo})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 700,
});

export const settingsName = style({
  fontSize: 15,
  fontWeight: 600,
  color: vars.color.foreground,
});

export const settingsMeta = style({
  fontSize: 12,
  color: vars.color.muted,
  marginTop: 2,
});

export const settingsFieldLabel = style({
  fontSize: 11,
  fontWeight: 600,
  color: vars.color.muted,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 16,
});

export const homeRoot = style({
  minHeight: "100vh",
  background: vars.color.background,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: vars.font.dmSans,
  color: vars.color.foreground,
});

export const homeInner = style({
  textAlign: "center",
  maxWidth: 400,
});

export const homeLogoWrap = style({
  margin: "0 auto 28px",
  display: "flex",
  justifyContent: "center",
  width: "100%",
});

export const homeLogoImg = style({
  width: "min(88vw, 300px)",
  height: "auto",
  maxHeight: 96,
  display: "block",
  objectFit: "contain",
  "@media": {
    "(min-width: 480px)": {
      width: "min(72vw, 340px)",
      maxHeight: 112,
    },
  },
});

export const homeTitle = style({
  fontSize: 36,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  letterSpacing: "0.06em",
  marginBottom: 8,
});

export const homeTagline = style({
  fontSize: 14,
  color: vars.color.muted,
  marginBottom: 40,
});

export const homeCta = style({
  display: "inline-block",
  background: `linear-gradient(135deg, ${vars.color.orangeDark}, ${vars.color.red})`,
  borderRadius: 10,
  padding: "12px 32px",
  color: vars.color.white,
  fontWeight: 600,
  fontSize: 14,
  textDecoration: "none",
  letterSpacing: "0.02em",
});

export const authErrorRoot = style({
  minHeight: "100vh",
  background: vars.color.background,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: vars.font.dmSans,
  color: vars.color.foreground,
});

export const authErrorInner = style({
  textAlign: "center",
});

export const authErrorEmoji = style({
  fontSize: 48,
  marginBottom: 16,
});

export const authErrorTitle = style({
  fontSize: 24,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 8,
});

export const authErrorDetail = style({
  color: vars.color.muted2,
  marginBottom: 24,
  fontSize: 13,
  fontFamily: "monospace",
});

export const authErrorRetry = style({
  background: "rgba(249,115,22,0.2)",
  border: `1px solid ${vars.color.orangeBorderStrong}`,
  borderRadius: 8,
  padding: "10px 24px",
  color: vars.color.orange,
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
});

export const langSwitchRow = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

export const langBtn = style({
  background: "transparent",
  border: "none",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: vars.font.dmSans,
  cursor: "pointer",
  letterSpacing: "0.06em",
});

export const langBtnActive = style({
  color: vars.color.orange,
  background: "rgba(249,115,22,0.12)",
  cursor: "default",
});

export const langBtnInactive = style({
  color: vars.color.muted,
  selectors: {
    "&:hover": {
      color: vars.color.foreground,
      background: vars.color.overlayLight,
    },
  },
});

export const langDivider = style({
  color: vars.color.border,
  fontSize: 13,
  userSelect: "none",
});
