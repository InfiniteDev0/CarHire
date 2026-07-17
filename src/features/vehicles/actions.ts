"use server";

import { createClient } from "@/lib/supabase/server";
import { assertUnderLimit } from "@/lib/limits";
import { carSchema, normalizePlate, toInt, toMoney, type CarInput } from "@/lib/validation/car";

/** Throw unless the caller is an active admin of `orgId`. Returns the client. */
async function assertAdmin(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data } = await supabase
    .from("org_members")
    .select("role, is_active")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || data.role !== "admin" || !data.is_active) {
    throw new Error("Only admins can manage vehicles.");
  }
  return supabase;
}

function toRow(v: CarInput) {
  return {
    reg_number: normalizePlate(v.regNumber),
    make: v.make,
    model: v.model,
    year: toInt(v.year),
    capacity: toInt(v.capacity),
    status: v.status,
    county: v.county || null,
    domicile: v.domicile || null,
    color: v.color || null,
    body_type: v.bodyType || null,
    transmission: v.transmission || null,
    fuel_type: v.fuelType || null,
    engine: v.engine || null,
    mileage: toInt(v.mileage),
    rate_per_day: toMoney(v.ratePerDay),
    deposit: toMoney(v.deposit),
    image_url: v.imageUrl || null,
    owner_name: v.ownerName || null,
    owner_phone: v.ownerPhone || null,
    num_owners: toInt(v.numOwners),
    insurance_expiry: v.insuranceExpiry || null,
    inspection_status: v.inspectionStatus || null,
    notes: v.notes || null,
  };
}

function parseOrThrow(input: CarInput) {
  const parsed = carSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid details.");
  }
  return parsed.data;
}

export async function createCar(orgId: string, input: CarInput): Promise<void> {
  const supabase = await assertAdmin(orgId);
  await assertUnderLimit(supabase, orgId, "vehicles");
  const v = parseOrThrow(input);
  const { error } = await supabase.from("cars").insert({ org_id: orgId, ...toRow(v) });
  if (error) {
    throw new Error(
      /duplicate|unique/i.test(error.message)
        ? "A vehicle with this registration already exists."
        : error.message
    );
  }
}

export async function updateCar(
  orgId: string,
  carId: string,
  input: CarInput
): Promise<void> {
  const supabase = await assertAdmin(orgId);
  const v = parseOrThrow(input);
  const { error } = await supabase
    .from("cars")
    .update(toRow(v))
    .eq("id", carId)
    .eq("org_id", orgId);
  if (error) {
    throw new Error(
      /duplicate|unique/i.test(error.message)
        ? "A vehicle with this registration already exists."
        : error.message
    );
  }
}

/** Soft-delete: keeps trip history intact by setting decommissioned_at. */
export async function decommissionCar(orgId: string, carId: string): Promise<void> {
  const supabase = await assertAdmin(orgId);
  const { error } = await supabase
    .from("cars")
    .update({ decommissioned_at: new Date().toISOString() })
    .eq("id", carId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}
