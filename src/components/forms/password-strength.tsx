import { cn } from "@/lib/utils";

// Visual strength — 5 checks, drives the 4 bars. Zod enforces the first four.
export function calcStrength(p: string) {
  if (!p) return { bars: 0, label: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (/[a-z]/.test(p)) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const labels = ["Too weak", "Too weak", "Weak", "Fair", "Strong", "Very strong"];
  return { bars: Math.min(score, 4), label: labels[score] };
}

const BAR_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

const RULES: { test: (p: string) => boolean; label: string }[] = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), label: "Upper & lowercase letters" },
  { test: (p) => /[0-9]/.test(p), label: "A number" },
];

/**
 * The signup password meter — 4 colored bars + a strength label. Shared so the
 * reset-password screen shows the exact same feedback as sign-up.
 * Pass `showRules` to also list the requirements with live check marks.
 */
export function PasswordStrength({
  password,
  showRules = false,
}: {
  password: string;
  showRules?: boolean;
}) {
  if (password.length === 0) return null;
  const strength = calcStrength(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded transition-colors",
              i < strength.bars ? BAR_COLORS[strength.bars - 1] : "bg-zinc-700"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strength.label}</p>

      {showRules && (
        <ul className="space-y-0.5 pt-0.5">
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li
                key={r.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  ok ? "text-green-500" : "text-muted-foreground"
                )}
              >
                <span className={cn("text-[10px]", ok ? "opacity-100" : "opacity-40")}>
                  {ok ? "✓" : "○"}
                </span>
                {r.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
