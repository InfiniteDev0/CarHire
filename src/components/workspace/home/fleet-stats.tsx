import Link from "next/link";
import { Car, CircleCheck, KeyRound, WrenchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FleetCounts {
  total: number;
  available: number;
  onTrip: number;
  maintenance: number;
}

export function FleetStats({
  orgId,
  counts,
}: {
  orgId: string;
  counts: FleetCounts;
}) {
  return (
    <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-4">
      {/* Total fleet */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="gap-1">
            <Car className="size-3" /> Vehicles
          </Badge>
          <Button asChild className="h-6 rounded-sm px-2 text-xs">
            <Link href={`/workspace/${orgId}/vehicles?new=1`}>Add</Link>
          </Button>
        </div>
        <div>
          <p className="text-3xl font-semibold leading-none tabular-nums">{counts.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Total fleet</p>
        </div>
      </div>

      {/* Available */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <CircleCheck className="size-3" />
            Available
          </Badge>
        </div>
        <div>
          <p className="text-3xl font-semibold leading-none tabular-nums text-green-600 dark:text-green-400">
            {counts.available}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Ready to rent out</p>
        </div>
      </div>

      {/* On rent */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <KeyRound className="size-3" />
            On rent
          </Badge>
        </div>
        <div>
          <p className="text-3xl font-semibold leading-none tabular-nums text-blue-600 dark:text-blue-400">
            {counts.onTrip}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Away with clients</p>
        </div>
      </div>

      {/* Maintenance */}
      <div className="flex h-28 flex-col justify-between rounded-xl dark:bg-black bg-white p-3">
        <div className="flex items-start justify-between">
          <Badge className="gap-1 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            <WrenchIcon className="size-3" />
            Service
          </Badge>
        </div>
        <div>
          <p className="text-3xl font-semibold leading-none tabular-nums text-red-600 dark:text-red-400">
            {counts.maintenance}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Need maintenance</p>
        </div>
      </div>
    </div>
  );
}
