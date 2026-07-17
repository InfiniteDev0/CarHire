import { ThemePicker } from "@/features/settings/components/theme-picker";

export const metadata = { title: "Appearance · Settings · CarHire" };

export default function AppearanceSettingsPage() {
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
    </div>
  );
}
