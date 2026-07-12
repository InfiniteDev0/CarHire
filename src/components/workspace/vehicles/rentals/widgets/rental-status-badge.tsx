import { CircleCheck, Clock, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RentalStatus } from "@/lib/constants/rentals";

const CONFIG: Record<
  RentalStatus,
  { label: string; icon: typeof CircleCheck; className: string }
> = {
  ACTIVE: {
    label: "Active",
    icon: CircleCheck,
    className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  DUE_SOON: {
    label: "Due soon",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  OVERDUE: {
    label: "Overdue",
    icon: TriangleAlert,
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
  const { label, icon: Icon, className } = CONFIG[status];
  return (
    <Badge className={cn("gap-1", className)}>
      <Icon />
      {label}
    </Badge>
  );
}
