import Link from "next/link";
import { HandCoins, ReceiptText, TriangleAlert, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MoneyStatsData {
  monthRevenue: number;
  outstanding: number;
  clientDebt: number;
  /** 0–100, cars on trip as a share of the active fleet. */
  utilization: number;
}

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;

export function MoneyStats({
  orgId,
  data,
}: {
  orgId: string;
  data: MoneyStatsData;
}) {
  return (
    <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-4">
      {/* Revenue */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <HandCoins className="size-3" />
            Revenue
          </Badge>
          <Button asChild variant="outline" className="h-6 rounded-sm px-2 text-xs">
            <Link href={`/workspace/${orgId}/financials`}>Finance</Link>
          </Button>
        </div>
        <div>
          <p className="truncate text-2xl font-semibold leading-none tabular-nums text-green-600 dark:text-green-400">
            {kes(data.monthRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Collected this month</p>
        </div>
      </div>

      {/* Outstanding */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <ReceiptText className="size-3" />
            Outstanding
          </Badge>
        </div>
        <div>
          <p className="truncate text-2xl font-semibold leading-none tabular-nums text-amber-600 dark:text-amber-400">
            {kes(data.outstanding)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Unpaid balances</p>
        </div>
      </div>

      {/* Debt */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            <TriangleAlert className="size-3" />
            Debt
          </Badge>
        </div>
        <div>
          <p className="truncate text-2xl font-semibold leading-none tabular-nums text-red-600 dark:text-red-400">
            {kes(data.clientDebt)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Client debt on file</p>
        </div>
      </div>

      {/* Utilization */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Gauge className="size-3" />
            Utilization
          </Badge>
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none tabular-nums text-blue-600 dark:text-blue-400">
            {data.utilization}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Fleet out on rent</p>
        </div>
      </div>
    </div>
  );
}
