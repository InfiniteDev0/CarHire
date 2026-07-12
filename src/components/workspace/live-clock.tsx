"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// Client-only: starts empty and fills in after mount so SSR/CSR never
// disagree on the current time (which would trigger a hydration warning).
export function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(formatter.format(new Date()));
    // Defer the first update off the effect body (avoids a synchronous
    // setState-in-effect) — fills in immediately after mount either way.
    const first = setTimeout(update, 0);
    const id = setInterval(update, 1000 * 30);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <div className={cn("flex items-center gap-1 tabular-nums", className)}>
      <Clock className="size-4" />
      {time ?? "--:--"}
    </div>
  );
}
