import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";
import { blinkCaret } from "./animations.css";

export const root = style({
  display: "flex",
  flexDirection: "column",
  height: 480,
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  overflow: "hidden",
});

export const header = style({
  padding: "12px 16px",
  borderBottom: `1px solid ${vars.color.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
});

export const headerLeft = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

export const headerTitle = style({
  fontSize: 13,
  fontWeight: 700,
  color: vars.color.orange,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
});

export const headerStatus = style({
  fontSize: 11,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
});

export const resetBtn = style({
  background: "transparent",
  border: "none",
  color: vars.color.slate,
  fontSize: 11,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  padding: "2px 6px",
});

export const messages = style({
  flex: 1,
  overflowY: "auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
});

export const emptyWrap = style({
  margin: "auto",
  width: "100%",
  maxWidth: 360,
});

export const emptyHint = style({
  textAlign: "center",
  color: vars.color.slate,
  fontSize: 13,
  marginBottom: 20,
});

export const suggestedCol = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export const suggestedBtn = style({
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 10,
  padding: "10px 14px",
  color: vars.color.muted2,
  fontSize: 12,
  cursor: "pointer",
  textAlign: "left",
  fontFamily: vars.font.dmSans,
  transition: "border-color 0.2s, color 0.2s",
  ":hover": {
    borderColor: "rgba(249,115,22,0.3)",
    color: vars.color.textSlate,
  },
});

export const bubbleRow = style({
  display: "flex",
  marginBottom: 12,
});

export const bubbleRowUser = style({
  justifyContent: "flex-end",
});

export const bubbleRowAssistant = style({
  justifyContent: "flex-start",
});

export const avatarBot = style({
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: vars.color.orangeGlow,
  border: `1px solid ${vars.color.orangeBorderStrong}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  flexShrink: 0,
  marginRight: 10,
  marginTop: 2,
});

export const bubble = style({
  maxWidth: "75%",
  padding: "10px 14px",
  fontSize: 13,
  lineHeight: 1.65,
  wordBreak: "break-word",
  fontFamily: vars.font.dmSans,
});

export const bubbleUser = style({
  borderRadius: "16px 16px 4px 16px",
  background: vars.color.orangeGlow,
  border: `1px solid rgba(249,115,22,0.25)`,
  color: vars.color.userBubble,
});

export const bubbleAssistant = style({
  borderRadius: "16px 16px 16px 4px",
  background: vars.color.overlayHover,
  border: `1px solid ${vars.color.borderStrong}`,
  color: vars.color.textMutedLight,
});

export const listRow = style({
  display: "flex",
  gap: 6,
  marginBottom: 3,
});

export const listBullet = style({
  color: vars.color.orange,
  flexShrink: 0,
  marginTop: 1,
});

export const listNum = style({
  color: vars.color.orange,
  flexShrink: 0,
  fontWeight: 700,
  minWidth: 14,
});

export const mdStrong = style({
  color: vars.color.foreground,
  fontWeight: 700,
});

export const mdEm = style({
  color: vars.color.textMutedLight,
  fontStyle: "italic",
});

export const mdCode = style({
  background: "rgba(255,255,255,0.08)",
  borderRadius: 4,
  padding: "1px 5px",
  fontSize: 12,
  fontFamily: vars.font.dmMono,
  color: vars.color.orange,
});

export const spacer8 = style({
  height: 8,
});

export const caret = style([
  blinkCaret,
  {
    display: "inline-block",
    width: 2,
    height: 13,
    background: vars.color.orange,
    marginLeft: 2,
    verticalAlign: "middle",
  },
]);

export const inputBar = style({
  padding: "12px 16px",
  borderTop: `1px solid ${vars.color.border}`,
  display: "flex",
  gap: 8,
  flexShrink: 0,
});

export const textarea = style({
  flex: 1,
  background: vars.color.overlayHover,
  border: `1px solid ${vars.color.borderHover}`,
  borderRadius: 10,
  padding: "10px 12px",
  color: "#e2e8f0",
  fontSize: 13,
  fontFamily: vars.font.dmSans,
  resize: "none",
  outline: "none",
  lineHeight: 1.5,
});

export const sendBtn = style({
  borderRadius: 10,
  padding: "0 16px",
  fontSize: 18,
  flexShrink: 0,
  transition: "all 0.2s",
});

export const sendBtnActive = style({
  background: "rgba(249,115,22,0.2)",
  border: `1px solid rgba(249,115,22,0.4)`,
  color: vars.color.orange,
  cursor: "pointer",
});

export const sendBtnDisabled = style({
  background: vars.color.overlayHover,
  border: `1px solid ${vars.color.borderStrong}`,
  color: vars.color.slate,
  cursor: "not-allowed",
});

// ── History panel ────────────────────────────────────────────────────────────

export const historyBtn = style({
  background: "transparent",
  border: "none",
  color: vars.color.slate,
  fontSize: 11,
  cursor: "pointer",
  fontFamily: vars.font.dmSans,
  padding: "2px 6px",
  ":hover": {
    color: vars.color.textSlate,
  },
});

export const historyBtnActive = style({
  color: vars.color.orange,
});

export const historyPanel = style({
  flex: 1,
  overflowY: "auto",
  padding: "8px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

export const historyEmpty = style({
  margin: "auto",
  textAlign: "center",
  color: vars.color.muted,
  fontSize: 12,
  padding: "24px 0",
});

export const historyItem = style({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  padding: "10px 12px",
  borderRadius: 10,
  background: vars.color.overlayMed,
  border: `1px solid ${vars.color.borderSubtle}`,
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  textAlign: "left",
  ":hover": {
    borderColor: "rgba(249,115,22,0.3)",
    background: vars.color.overlayHover,
  },
});

export const historyItemActive = style({
  borderColor: "rgba(249,115,22,0.45)",
  background: vars.color.orangeGlow,
});

export const historyItemPreview = style({
  fontSize: 12,
  color: vars.color.textMutedLight,
  fontFamily: vars.font.dmSans,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const historyItemMeta = style({
  fontSize: 10,
  color: vars.color.muted,
  fontFamily: vars.font.dmMono,
});

export const historyLoadingRow = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  color: vars.color.muted,
  fontSize: 12,
  padding: "24px 0",
});

export const loadingDots = style({
  display: "inline-flex",
  gap: 4,
});
