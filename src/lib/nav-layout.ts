/** Desktop navigation style for the workspace shell. Mobile always uses the bottom pill. */
export type NavLayout = "topnav" | "sidebar";

/** Cookie the preference is saved in, so the server can render the right shell. */
export const NAV_LAYOUT_COOKIE = "socdal_nav_layout";
export const DEFAULT_NAV_LAYOUT: NavLayout = "topnav";

export function parseNavLayout(value: string | undefined | null): NavLayout {
  return value === "sidebar" || value === "topnav" ? value : DEFAULT_NAV_LAYOUT;
}
