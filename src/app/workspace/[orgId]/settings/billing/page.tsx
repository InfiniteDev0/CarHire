import Link from "next/link";
import { Crown } from "lucide-react";

import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { getOrgUsage, getOrgPlan, FREE_LIMITS, PLAN_LABELS, type LimitKey } from "@/lib/limits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const metadata = { title: "Billing · Settings · CarHire" };

const USAGE_LABEL: Record<LimitKey, string> = {
  staff: "Staff members",
  vehicles: "Vehicles",
  clients: "Clients",
  rentals: "Rentals",
};

export default async function BillingSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireAdmin(orgId);

  const supabase = await createClient();
  const [usage, plan] = await Promise.all([
    getOrgUsage(supabase, orgId),
    getOrgPlan(supabase, orgId),
  ]);
  const onFree = plan === "FREE";

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Billing</h2>
        <p className="text-xs text-muted-foreground">
          Your plan and how much of it you&apos;re using.
        </p>
      </div>

      {/* Current plan */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{PLAN_LABELS[plan]} plan</Badge>
          <span className="text-sm text-muted-foreground">
            {onFree
              ? `Up to ${FREE_LIMITS.staff} staff, ${FREE_LIMITS.vehicles} vehicles and ${FREE_LIMITS.clients} clients.`
              : "Unlimited vehicles, staff and clients."}
          </span>
        </div>
        <Button asChild variant="outline" className="h-8 gap-1.5 rounded-sm text-xs">
          <Link href={`/workspace/${orgId}/pricing`}>
            <Crown className="size-3.5" />
            {onFree ? "Upgrade to Pro" : "Manage plan"}
          </Link>
        </Button>
      </div>

      {/* Usage */}
      <div className="flex flex-col gap-4 rounded-lg border p-3">
        {(Object.keys(FREE_LIMITS) as LimitKey[]).map((key) => {
          const used = usage[key];
          const cap = FREE_LIMITS[key];
          const atLimit = onFree && used >= cap;
          return (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{USAGE_LABEL[key]}</span>
                <span
                  className={
                    atLimit ? "font-medium text-red-600 dark:text-red-400" : "text-muted-foreground"
                  }
                >
                  {onFree ? `${used} / ${cap}` : `${used} · Unlimited`}
                </span>
              </div>
              {/* Paid plans have no cap, so no meter — just the live count. */}
              {onFree && <Progress value={Math.min(100, (used / cap) * 100)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
