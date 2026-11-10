import { cookies } from "next/headers";
import { ThemePicker } from "@/features/settings/components/theme-picker";
import { NavLayoutPicker } from "@/features/workspace/nav-layout-toggle";
import { NAV_LAYOUT_COOKIE, parseNavLayout } from "@/lib/nav-layout";

export const metadata = { title: "Appearance · Settings · Socdal" };

export default async function AppearanceSettingsPage() {
  const navLayout = parseNavLayout((await cookies()).get(NAV_LAYOUT_COOKIE)?.value);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Appearance</h2>
        <p className="text-xs text-muted-foreground">
          Light or dark mode, or follow your system setting. Saved on this
          device.
        </p>
      </div>
      <ThemePicker />

      <div className="mt-4 space-y-1">
        <h2 className="text-sm font-medium">Navigation</h2>
        <p className="text-xs text-muted-foreground">
          Choose where the main menu sits on desktop. Phones always use the
          bottom bar. Saved on this device.
        </p>
      </div>
      <NavLayoutPicker layout={navLayout} />
    </div>
  );
}
