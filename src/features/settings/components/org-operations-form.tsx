"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orgOperationsSchema } from "@/lib/validation/settings";
import { updateOrgOperations } from "../actions";

export interface OrgOperations {
  curfewStart: string;
  curfewEnd: string;
  rateFloor: string;
  rateCeiling: string;
  refuelPenalty: string;
}

export function OrgOperationsForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: OrgOperations;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OrgOperations>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const set = <K extends keyof OrgOperations>(k: K, v: OrgOperations[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const result = orgOperationsSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      await updateOrgOperations(orgId, form);
      toast.success("Operating rules saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      <div>
        <h2 className="text-sm font-medium">Curfew lockout</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          No new checkouts between these hours (e.g. 18:30 → 06:00). Leave empty
          to disable.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="curfewStart">Lockout starts</Label>
            <Input
              id="curfewStart"
              type="time"
              value={form.curfewStart}
              onChange={(e) => set("curfewStart", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="curfewEnd">Lockout ends</Label>
            <Input
              id="curfewEnd"
              type="time"
              value={form.curfewEnd}
              onChange={(e) => set("curfewEnd", e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.curfewEnd}
            />
            {errors.curfewEnd && <p className="text-xs text-destructive">{errors.curfewEnd}</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium">Daily rate guardrails (KES)</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Contracts must be priced inside this range — stops unauthorized
          discounting. Leave empty to disable.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rateFloor">Minimum / day</Label>
            <Input
              id="rateFloor"
              type="number"
              min={0}
              value={form.rateFloor}
              onChange={(e) => set("rateFloor", e.target.value)}
              placeholder="2000"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rateCeiling">Maximum / day</Label>
            <Input
              id="rateCeiling"
              type="number"
              min={0}
              value={form.rateCeiling}
              onChange={(e) => set("rateCeiling", e.target.value)}
              placeholder="15000"
              disabled={isLoading}
              aria-invalid={!!errors.rateCeiling}
            />
            {errors.rateCeiling && (
              <p className="text-xs text-destructive">{errors.rateCeiling}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium">Refuel penalty (KES)</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Charged per missing fuel-gauge step at check-in — staff see this as the
          suggested penalty and can adjust per return.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="refuelPenalty">Per gauge step</Label>
            <Input
              id="refuelPenalty"
              type="number"
              min={0}
              value={form.refuelPenalty}
              onChange={(e) => set("refuelPenalty", e.target.value)}
              placeholder="1500"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
