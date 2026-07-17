"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const APPEARANCE = [
  { id: "light", label: "Light", src: "/theme-light.svg" },
  { id: "dark", label: "Dark", src: "/theme-dark.svg" },
  { id: "system", label: "Auto", src: "/theme-system.svg" },
] as const;

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="grid max-w-md  grid-cols-3 gap-3">
      {APPEARANCE.map((option) => {
        const isSelected = mounted && theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className="flex w-fit p-0 flex-col gap-2 text-left group focus:outline-none"
          >
            {/* Card wrapper */}
            <div
              className={cn(
                "w-fit h-[68px] rounded-lg border relative flex items-center justify-center transition-all duration-200 bg-muted",
                isSelected
                  ? "border-foreground border-2"
                  : "border-border hover:border-muted-foreground/50",
              )}
            >
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={option.src}
                  alt={option.label}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            </div>
            <span
              className={cn(
                "text-xs font-medium pl-0.5",
                isSelected
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// const APPEARANCE = [
//   { id: "light", label: "Light", src: "/theme-light.svg" },
//   { id: "dark", label: "Dark", src: "/theme-dark.svg" },
//   { id: "system", label: "Auto", src: "/theme-system.svg" },
// ] as const;

// const ACCENTS = [
//   { id: "black", label: "Black", color: "#18181b" },
//   { id: "purple", label: "Purple", color: "#818cf8" },
//   { id: "blue", label: "Blue", color: "#38bdf8" },
//   { id: "pink", label: "Pink", color: "#f472b6" },
//   { id: "violet", label: "Violet", color: "#c084fc" },
//   { id: "indigo", label: "Indigo", color: "#6366f1" },
//   { id: "orange", label: "Orange", color: "#fb923c" },
//   { id: "teal", label: "Teal", color: "#2dd4bf" },
//   { id: "bronze", label: "Bronze", color: "#a78bfa" },
//   { id: "mint", label: "Mint", color: "#34d399" },
// ] as const;
