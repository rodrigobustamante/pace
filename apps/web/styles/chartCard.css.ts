import { style } from "@vanilla-extract/css";
import { vars } from "./theme.css";

export const root = style({
  background: vars.color.overlayLight,
  border: `1px solid ${vars.color.borderSubtle}`,
  borderRadius: 16,
  padding: 24,
});

export const kicker = style({
  fontSize: 12,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: vars.color.muted2,
  marginBottom: 4,
  fontFamily: vars.font.dmMono,
});

export const kickerAlt = style({
  fontSize: 11,
  fontWeight: 600,
  color: vars.color.textSlate,
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
});

export const titleLg = style({
  fontSize: 24,
  fontWeight: 800,
  fontFamily: vars.font.barlow,
  marginBottom: 16,
});

export const title = style({
  fontSize: 22,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 20,
});

export const titleMb8 = style({
  fontSize: 22,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 8,
});

export const titleMb4 = style({
  fontSize: 22,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 4,
});

export const accentOrange = style({
  color: vars.color.orange,
});

export const accentGreen = style({
  color: vars.color.green,
});

export const chartCaption = style({
  fontSize: 11,
  color: vars.color.muted,
  marginBottom: 16,
});

/** Segundo gráfico apilado bajo el principal (misma tarjeta) */
export const stackedChartBlock = style({
  marginTop: 20,
  paddingTop: 16,
  borderTop: `1px solid ${vars.color.borderSubtle}`,
});

export const stackedChartTitle = style({
  fontSize: 15,
  fontWeight: 700,
  fontFamily: vars.font.barlow,
  marginBottom: 6,
  color: vars.color.foreground,
});

export const stackedChartAccentBlue = style({
  color: vars.color.blue,
});

export const radarLegend = style({
  marginTop: 12,
  paddingTop: 14,
  borderTop: `1px solid ${vars.color.borderSubtle}`,
});

export const radarLegendTitle = style({
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: vars.color.muted2,
  marginBottom: 10,
  fontFamily: vars.font.dmMono,
});

export const radarLegendList = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
  margin: 0,
  padding: 0,
  listStyle: "none",
});

export const radarLegendItem = style({
  fontSize: 11,
  color: vars.color.textSlate,
  lineHeight: 1.55,
  fontFamily: vars.font.dmSans,
});

export const radarLegendName = style({
  fontWeight: 700,
  color: vars.color.foreground,
  marginRight: 6,
});

export const radarLegendFoot = style({
  fontSize: 10,
  color: vars.color.muted,
  marginTop: 10,
  lineHeight: 1.5,
  fontStyle: "italic",
});
