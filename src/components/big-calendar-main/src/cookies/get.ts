import { THEMES_VALUES } from "@cal/constants/theme.const";
import { DEFAULT_VALUES } from "@cal/constants/cookies.const";

export type TTheme = (typeof THEMES_VALUES)[number];

// The host app manages theme via next-themes, so the calendar just uses its
// default here instead of reading a cookie (cookies() is async in Next 16).
export function getTheme(): TTheme {
  return DEFAULT_VALUES.theme as TTheme;
}
