import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./theme.css";

globalStyle("body", {
  margin: 0,
  padding: 0,
  color: vars.color.foreground,
  background: vars.color.background,
  fontFamily: vars.font.dmSans,
});

globalStyle("*", {
  boxSizing: "border-box",
});

globalStyle("::-webkit-scrollbar", {
  width: "4px",
});

globalStyle("::-webkit-scrollbar-thumb", {
  background: vars.color.slateDark,
  borderRadius: "4px",
});
