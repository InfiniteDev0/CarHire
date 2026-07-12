import Link from "next/link";
import { Car, CircleCheck, WrenchOff } from "lucide-react";
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
    <div className="grid auto-rows-min gap-4 md:grid-cols-4">
      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            <Car /> Vehicles
          </Badge>
          <Button asChild className="h-7 cursor-pointer">
            <Link href={`/workspace/${orgId}/vehicles`}>Add</Link>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm">Total fleet</p>
          <p className="text-3xl">{counts.total}</p>
        </div>
      </div>

      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
          <CircleCheck />
          Available
        </Badge>
        <div className="flex items-center justify-between">
          <p className="text-sm">Available for rent</p>
          <p className="text-3xl">{counts.available}</p>
        </div>
      </div>

      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <Badge>On Rent</Badge>
        <div className="flex items-center justify-between">
          <p className="text-sm">Away on rent</p>
          <p className="text-3xl">{counts.onTrip}</p>
        </div>
      </div>

      <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-2">
        <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
          <WrenchOff />
          Need Service
        </Badge>
        <div className="flex items-center justify-between">
          <p className="text-sm">Need maintenance</p>
          <p className="text-3xl">{counts.maintenance}</p>
        </div>
      </div>
    </div>
  );
}
