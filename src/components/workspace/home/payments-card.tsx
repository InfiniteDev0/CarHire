"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface PaymentPoint {
  amount: number;
  created_at: string;
}

export interface ExpensePoint {
  amount: number;
  incurred_on: string;
}

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const DAY = 86400_000;
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

// Explicit color — independent of the theme's --chart-* variables.
const chartConfig = {
  collected: {
    label: "Collected",
    color: "#38bdf8", // sky blue, like the reference dashboard
  },
} satisfies ChartConfig;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function PaymentsCard({
  payments,
  expenses,
  outstanding,
}: {
  payments: PaymentPoint[];
  expenses: ExpensePoint[];
  outstanding: number;
}) {
  const [range, setRange] = useState<Range>(30);

  const { data, income, spent } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = today.getTime() - (range - 1) * DAY;

    const byDay = new Map<string, number>();
    let income = 0;
    for (const p of payments) {
      const t = new Date(p.created_at);
      if (t.getTime() < cutoff) continue;
      income += Number(p.amount);
      const k = dayKey(t);
      byDay.set(k, (byDay.get(k) ?? 0) + Number(p.amount));
    }

    let spent = 0;
    for (const e of expenses) {
      if (new Date(e.incurred_on).getTime() >= cutoff) spent += Number(e.amount);
    }

    const data: { date: string; collected: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY);
      const k = dayKey(d);
      data.push({ date: k, collected: byDay.get(k) ?? 0 });
    }
    return { data, income, spent };
  }, [payments, expenses, range]);

  return (
    <Card className="py-4 sm:py-0">
      <div className="flex flex-col sm:flex-row">
        {/* Stat rail */}
        <div className="flex shrink-0 flex-col border-b sm:w-52 sm:border-b-0 sm:border-r">
          <CardHeader className="px-4 pt-4 sm:pb-0">
            <CardTitle>Rental payments</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <CalendarDays className="size-3" />
              Last {range} days
            </CardDescription>
          </CardHeader>
          <div className="flex sm:flex-col">
            <div className="flex flex-col gap-0.5 border-l-2 border-sky-400 bg-muted/40 px-4 py-3">
              <span className="text-xs text-muted-foreground">Total income</span>
              <span className="text-base font-bold leading-none sm:text-lg">{kes(income)}</span>
            </div>
            <div className="flex flex-col gap-0.5 px-4 py-3">
              <span className="text-xs text-muted-foreground">Outstanding</span>
              <span className="text-base font-bold leading-none text-amber-600 dark:text-amber-400 sm:text-lg">
                {kes(outstanding)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 px-4 py-3">
              <span className="text-xs text-muted-foreground">Expenses</span>
              <span className="text-base font-bold leading-none text-red-600 dark:text-red-400 sm:text-lg">
                {kes(spent)}
              </span>
            </div>
          </div>
        </div>

        {/* Chart + range filter */}
        <CardContent className="flex-1 px-2 pb-4 pt-3 sm:p-6 sm:pt-4">
          <div className="mb-2 flex justify-end gap-1.5 px-2 sm:px-0">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  range === r
                    ? "border-foreground bg-foreground text-background"
                    : "border-input text-muted-foreground hover:text-foreground"
                )}
              >
                {r}d
              </button>
            ))}
          </div>
          <ChartContainer config={chartConfig} className="aspect-auto h-52 w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
              <defs>
                <linearGradient id="fillHomeCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-collected)" stopOpacity={0.55} />
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
                    className="w-44"
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
                fill="url(#fillHomeCollected)"
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
