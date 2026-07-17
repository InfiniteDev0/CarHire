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
    <div className="grid auto-rows-min gap-4 md:grid-cols-4">
      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <div className="flex items-center justify-between">
          <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <HandCoins />
            Revenue
          </Badge>
          <Button asChild variant="outline" className="h-7 cursor-pointer">
            <Link href={`/workspace/${orgId}/financials`}>Finance</Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm">Collected this month</p>
          <p className="text-xl font-semibold">{kes(data.monthRevenue)}</p>
        </div>
      </div>

      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <ReceiptText />
          Outstanding
        </Badge>
        <div className="flex items-center justify-between">
          <p className="text-sm">Unpaid balances</p>
          <p className="text-xl font-semibold">{kes(data.outstanding)}</p>
        </div>
      </div>

      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
          <TriangleAlert />
          Debt
        </Badge>
        <div className="flex items-center justify-between">
          <p className="text-sm">Client debt on file</p>
          <p className="text-xl font-semibold">{kes(data.clientDebt)}</p>
        </div>
      </div>

      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <Badge variant="outline">
          <Gauge />
          Utilization
        </Badge>
        <div className="flex items-center justify-between">
          <p className="text-sm">Fleet out on rent</p>
          <p className="text-xl font-semibold">{data.utilization}%</p>
        </div>
      </div>
    </div>
  );
}
