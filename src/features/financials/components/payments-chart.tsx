"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface DayCollection {
  date: string; // "YYYY-MM-DD"
  collected: number;
}

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;

const chartConfig = {
  collected: {
    label: "Collected",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PaymentsChart({
  data,
  totals,
}: {
  data: DayCollection[];
  totals: { income30d: number; outstanding: number; clientDebt: number };
}) {
  return (
    <Card className="py-4 sm:py-0">
      <div className="flex flex-col sm:flex-row">
        {/* Stat rail */}
        <div className="flex shrink-0 flex-row border-b sm:w-48 sm:flex-col sm:border-b-0 sm:border-r">
          <CardHeader className="px-4 pt-4 sm:pb-0">
            <CardTitle>Rental payments</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <div className="ml-auto flex sm:ml-0 sm:flex-col">
            {(
              [
                ["Total income", kes(totals.income30d), "text-foreground"],
                ["Outstanding", kes(totals.outstanding), "text-amber-600 dark:text-amber-400"],
                ["Client debt", kes(totals.clientDebt), "text-red-600 dark:text-red-400"],
              ] as const
            ).map(([label, value, accent]) => (
              <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-base font-bold leading-none sm:text-lg ${accent}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <CardContent className="flex-1 px-2 pb-4 pt-4 sm:p-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="fillCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--color-collected)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-KE", { month: "short", day: "numeric" })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={52}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-40"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-KE", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                }
              />
              <Area
                dataKey="collected"
                type="monotone"
                fill="url(#fillCollected)"
                stroke="var(--color-collected)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </div>
    </Card>
  );
}
