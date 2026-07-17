"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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

export interface MonthMoney {
  month: string; // "Feb", "Mar", …
  revenue: number;
  expenses: number;
}

// Explicit colors — independent of the theme's --chart-* variables.
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#10b981", // emerald
  },
  expenses: {
    label: "Expenses",
    color: "#f59e0b", // amber
  },
} satisfies ChartConfig;

export function RevenueChart({ data }: { data: MonthMoney[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs expenses</CardTitle>
        <CardDescription>Last 6 months, KES</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-64 w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
