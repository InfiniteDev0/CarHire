"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/features/onboarding/data/counties";
import { orgSettingsSchema } from "@/lib/validation/settings";
import { updateOrgSettings } from "../actions";

const NONE = "__none";

export interface OrgSettings {
  name: string;
  phone: string;
  county: string;
  curfewStart: string;
  curfewEnd: string;
  rateFloor: string;
  rateCeiling: string;
}

export function SettingsForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: OrgSettings;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OrgSettings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const set = <K extends keyof OrgSettings>(k: K, v: OrgSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const result = orgSettingsSchema.safeParse(form);
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
      await updateOrgSettings(orgId, form);
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-6">
      {/* Business details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="name">Business name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Business phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+254 7XX XXX XXX"
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Primary county</Label>
          <Select
            value={form.county || NONE}
            onValueChange={(v) => set("county", v === NONE ? "" : v)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {KENYA_COUNTIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Operating rules */}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
