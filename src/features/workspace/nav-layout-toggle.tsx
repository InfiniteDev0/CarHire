"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PanelLeft, PanelTop } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_LAYOUT_COOKIE, type NavLayout } from "@/lib/nav-layout";

const ONE_YEAR = 60 * 60 * 24 * 365;

function useSetNavLayout() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLayout(next: NavLayout) {
    document.cookie = `${NAV_LAYOUT_COOKIE}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    // The workspace layout reads the cookie on the server — re-render it.
    startTransition(() => router.refresh());
  }

  return { setLayout, pending };
}

/** Compact header button that flips between the sidebar and the top navigation. */
export function NavLayoutToggle({ layout }: { layout: NavLayout }) {
  const { setLayout, pending } = useSetNavLayout();
  const next: NavLayout = layout === "sidebar" ? "topnav" : "sidebar";
  const label = next === "topnav" ? "Switch to top navigation" : "Switch to sidebar";
  const Icon = next === "topnav" ? PanelTop : PanelLeft;

  return (
    <button
      type="button"
      onClick={() => setLayout(next)}
      disabled={pending}
      aria-label={label}
      title={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <Icon className="size-4" />
    </button>
  );
}

const OPTIONS: { id: NavLayout; label: string; hint: string; icon: typeof PanelTop }[] = [
  { id: "topnav", label: "Top navigation", hint: "Menu across the top", icon: PanelTop },
  { id: "sidebar", label: "Sidebar", hint: "Menu down the left", icon: PanelLeft },
];

/** Settings → Appearance picker for the desktop navigation style. */
export function NavLayoutPicker({ layout }: { layout: NavLayout }) {
  const { setLayout, pending } = useSetNavLayout();

  return (
    <div className="grid max-w-md grid-cols-2 gap-3">
      {OPTIONS.map((option) => {
        const selected = option.id === layout;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setLayout(option.id)}
            disabled={pending || selected}
            aria-pressed={selected}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary/10"
                : "border-border hover:border-muted-foreground/50",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <option.icon className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
