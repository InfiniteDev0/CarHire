import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends ComponentProps<"div"> {
  value?: number; // 0-100
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-slot="progress"
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-zinc-800", className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-white transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
