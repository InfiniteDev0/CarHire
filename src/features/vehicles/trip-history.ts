import type { ContractStatus } from "@/features/rentals/helpers";

export interface VehicleTrip {
  id: string;
  status: ContractStatus;
  clientName: string | null;
  contract_start: string | null;
  contract_expiration: string | null;
  duration_days: number;
  total_amount: number | null;
  created_at: string;
}

// Columns pulled for a vehicle's trip list (works from browser or server client).
export const VEHICLE_TRIP_COLUMNS =
  "id, status, contract_start, contract_expiration, duration_days, total_amount, created_at, clients(full_name)";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapTrip(row: any): VehicleTrip {
  return {
    id: row.id,
    status: row.status,
    clientName: row.clients?.full_name ?? null,
    contract_start: row.contract_start,
    contract_expiration: row.contract_expiration,
    duration_days: row.duration_days,
    total_amount: row.total_amount,
    created_at: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** OVERDUE is computed on read (ACTIVE past its expiration), like everywhere else. */
export function tripDisplayStatus(t: VehicleTrip): ContractStatus {
  if (
    t.status === "ACTIVE" &&
    t.contract_expiration &&
    new Date(t.contract_expiration).getTime() < Date.now()
  ) {
    return "OVERDUE";
  }
  return t.status;
}

export const TRIP_STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-zinc-500/15 text-zinc-400",
  ACTIVE: "bg-blue-500/15 text-blue-400",
  EXTENDED: "bg-violet-500/15 text-violet-400",
  OVERDUE: "bg-red-500/15 text-red-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  CANCELLED: "bg-zinc-500/15 text-zinc-500",
};
