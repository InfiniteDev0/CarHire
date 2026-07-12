import type { Vehicle } from "./types";
import type { CarStatus } from "@/lib/validation/car";

export type VehicleSort = "NEW" | "RATE_ASC" | "RATE_DESC" | "MAKE";

export interface VehicleFilters {
  status: "ALL" | CarStatus;
  bodyTypes: string[];
  transmission: string; // "" = any
  fuelTypes: string[];
  minRate: string;
  maxRate: string;
}

export const EMPTY_FILTERS: VehicleFilters = {
  status: "ALL",
  bodyTypes: [],
  transmission: "",
  fuelTypes: [],
  minRate: "",
  maxRate: "",
};

export function activeFilterCount(f: VehicleFilters): number {
  let n = 0;
  if (f.status !== "ALL") n++;
  n += f.bodyTypes.length;
  if (f.transmission) n++;
  n += f.fuelTypes.length;
  if (f.minRate || f.maxRate) n++;
  return n;
}

export function filterVehicles(
  cars: Vehicle[],
  search: string,
  f: VehicleFilters
): Vehicle[] {
  const q = search.trim().toLowerCase();
  const min = f.minRate ? Number(f.minRate) : null;
  const max = f.maxRate ? Number(f.maxRate) : null;

  return cars.filter((c) => {
    if (f.status !== "ALL" && c.status !== f.status) return false;
    if (f.bodyTypes.length && (!c.body_type || !f.bodyTypes.includes(c.body_type)))
      return false;
    if (f.transmission && c.transmission !== f.transmission) return false;
    if (f.fuelTypes.length && (!c.fuel_type || !f.fuelTypes.includes(c.fuel_type)))
      return false;
    if (min != null && (c.rate_per_day == null || c.rate_per_day < min)) return false;
    if (max != null && (c.rate_per_day == null || c.rate_per_day > max)) return false;
    if (
      q &&
      ![c.reg_number, c.make, c.model]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    )
      return false;
    return true;
  });
}

export function sortVehicles(cars: Vehicle[], sort: VehicleSort): Vehicle[] {
  const arr = [...cars];
  switch (sort) {
    case "RATE_ASC":
      return arr.sort((a, b) => (a.rate_per_day ?? Infinity) - (b.rate_per_day ?? Infinity));
    case "RATE_DESC":
      return arr.sort((a, b) => (b.rate_per_day ?? -Infinity) - (a.rate_per_day ?? -Infinity));
    case "MAKE":
      return arr.sort((a, b) =>
        `${a.make ?? ""} ${a.model ?? ""}`.localeCompare(`${b.make ?? ""} ${b.model ?? ""}`)
      );
    default:
      return arr; // NEW = server order (created_at desc)
  }
}
