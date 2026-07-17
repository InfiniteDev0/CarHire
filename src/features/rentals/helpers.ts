import type { FuelLevel } from "@/lib/validation/contract";

export type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "EXTENDED"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export interface ContractRow {
  id: string;
  client_id: string;
  car_id: string;
  status: ContractStatus;
  is_self_drive: boolean;
  driver_name: string | null;
  driver_dl_number: string | null;
  driver_dl_expiry: string | null;
  rate_per_day: number;
  duration_days: number;
  routing: string | null;
  domicile: string | null;
  total_amount: number | null;
  amount_paid: number;
  deposit_amount: number;
  refuel_penalty: number;
  contract_start: string | null;
  contract_expiration: string | null;
  created_at: string;
  created_by: string | null;
  clients: { full_name: string; phone: string | null; is_blocked: boolean } | null;
  cars: { reg_number: string; make: string | null; model: string | null } | null;
  contract_extensions: { count: number }[] | null;
}

export const CONTRACT_COLUMNS =
  "id, client_id, car_id, status, is_self_drive, driver_name, driver_dl_number, driver_dl_expiry, rate_per_day, duration_days, routing, domicile, total_amount, amount_paid, deposit_amount, refuel_penalty, contract_start, contract_expiration, created_at, created_by, clients(full_name, phone, is_blocked), cars(reg_number, make, model), contract_extensions(count)";

/**
 * DB only stores DRAFT/ACTIVE/COMPLETED/CANCELLED — OVERDUE (active past its
 * expiration) and EXTENDED (active with authorized extensions) are computed
 * on read.
 */
export function displayStatus(
  c: Pick<ContractRow, "status" | "contract_expiration"> &
    Partial<Pick<ContractRow, "contract_extensions">>
): ContractStatus {
  if (c.status !== "ACTIVE") return c.status;
  if (
    c.contract_expiration &&
    new Date(c.contract_expiration).getTime() < Date.now()
  ) {
    return "OVERDUE";
  }
  if ((c.contract_extensions?.[0]?.count ?? 0) > 0) return "EXTENDED";
  return c.status;
}

export function contractBalance(
  c: Pick<ContractRow, "total_amount" | "amount_paid" | "refuel_penalty">
): number {
  return (c.total_amount ?? 0) + (c.refuel_penalty ?? 0) - (c.amount_paid ?? 0);
}

/**
 * Curfew lockout check (handles overnight windows like 18:30 → 06:00).
 * Times are "HH:MM" or "HH:MM:SS"; both null/empty → no curfew.
 */
export function isInCurfew(
  now: Date,
  curfewStart: string | null,
  curfewEnd: string | null
): boolean {
  if (!curfewStart || !curfewEnd) return false;
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const start = toMin(curfewStart);
  const end = toMin(curfewEnd);
  const t = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false;
  if (start < end) return t >= start && t < end; // same-day window
  return t >= start || t < end; // overnight wrap (e.g. Maghrib → dawn)
}

export interface CheckoutLog {
  id: string;
  dispatched_by: string | null;
  mileage: number | null;
  fuel_at_issue: FuelLevel | null;
  signature: string | null;
  created_at: string;
}

export interface CheckinLog {
  id: string;
  returned_by: string | null;
  received_by: string | null;
  mileage: number | null;
  fuel_at_return: FuelLevel | null;
  refuel_penalty: number;
  created_at: string;
}
