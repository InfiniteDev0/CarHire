import { CircleCheck, Route, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CarStatus } from "@/lib/validation/car";

const CONFIG: Record<
  CarStatus,
  { label: string; icon: typeof CircleCheck; className: string }
> = {
  AVAILABLE: {
    label: "Available",
    icon: CircleCheck,
    className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  TRIP: {
    label: "On trip",
    icon: Route,
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
};

export function VehicleStatusBadge({
  status,
  className,
}: {
  status: CarStatus;
  className?: string;
}) {
  const { label, icon: Icon, className: color } = CONFIG[status];
  return (
    <Badge className={cn("gap-1", color, className)}>
      <Icon />
      {label}
    </Badge>
  );
}
