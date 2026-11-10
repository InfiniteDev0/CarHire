import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

const MARK_PATH =
  "M45 0H121A10 10 0 0 1 131 10V83L98.5 130V46H40.5A6 6 0 0 0 34.5 52V123A8 8 0 0 1 26.5 131H8A8 8 0 0 1 0 123V45A9 9 0 0 1 9 36H29A6 6 0 0 0 35 30V10A10 10 0 0 1 45 0Z";

/** The Nidaam mark. Brand blue by default; pass a text colour class to recolour. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 131 131"
      aria-hidden="true"
      className={cn("size-7 shrink-0 text-primary", className)}
    >
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  /** Show the "by Nidaam Solutions" line under the product name. */
  byline?: boolean;
}

/** Mark + "Socdal" wordmark lockup. Inherits text colour from its parent. */
export function BrandLogo({ className, markClassName, byline = false }: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-tight">{BRAND.name}</span>
        {byline && (
          <span className="mt-1 text-[11px] font-normal opacity-70">by {BRAND.company}</span>
        )}
      </span>
    </span>
  );
}

/** Small "A product of Nidaam Solutions" attribution link. */
export function BrandAttribution({ className }: { className?: string }) {
  return (
    <a
      href={BRAND.companyUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <BrandMark className="size-3" />
      <span>
        {BRAND.name} by {BRAND.company} · {BRAND.companyDomain}
      </span>
    </a>
  );
}
