"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createContractSchema,
  checkoutSchema,
  checkinSchema,
  extendSchema,
  paymentSchema,
  fuelIndex,
  type CreateContractInput,
  type CheckoutInput,
  type CheckinInput,
} from "@/lib/validation/contract";
import { isInCurfew, type CheckoutLog, type CheckinLog } from "./helpers";

/** Throw unless the caller is an active member (staff or admin) of `orgId`. */
async function assertMember(orgId: string) {
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

  if (!data || !data.is_active) {
    throw new Error("You're not a member of this workspace.");
  }
  return { supabase, user };
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid details.";
}

/**
 * Create a rental agreement (DRAFT). Enforces: client not blocked, car
 * AVAILABLE, rate inside the org's floor/ceiling when configured.
 */
export async function createContract(
  orgId: string,
  input: CreateContractInput
): Promise<{ contractId: string }> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = createContractSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const [{ data: client }, { data: car }, { data: org }] = await Promise.all([
    supabase
      .from("clients")
      .select("is_blocked, debt_owed, full_name")
      .eq("id", v.clientId)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("cars")
      .select("status, reg_number")
      .eq("id", v.carId)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("rate_floor, rate_ceiling")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  if (!client) throw new Error("Client not found.");
  if (client.is_blocked) {
    throw new Error(`${client.full_name} is blocked and cannot hire until unblocked.`);
  }
  if (!car) throw new Error("Vehicle not found.");
  if (car.status !== "AVAILABLE") {
    throw new Error(`${car.reg_number} is not available right now.`);
  }

  const rate = Number(v.ratePerDay);
  if (org?.rate_floor != null && rate < Number(org.rate_floor)) {
    throw new Error(`Rate is below the workspace minimum (KES ${Number(org.rate_floor).toLocaleString()}/day).`);
  }
  if (org?.rate_ceiling != null && rate > Number(org.rate_ceiling)) {
    throw new Error(`Rate is above the workspace maximum (KES ${Number(org.rate_ceiling).toLocaleString()}/day).`);
  }

  const duration = Number(v.durationDays);
  const total = duration * rate;

  const { data: inserted, error } = await supabase
    .from("contracts")
    .insert({
      org_id: orgId,
      client_id: v.clientId,
      car_id: v.carId,
      is_self_drive: v.isSelfDrive,
      driver_name: v.isSelfDrive ? null : v.driverName,
      driver_dl_number: v.isSelfDrive ? null : v.driverDlNumber,
      driver_dl_expiry: v.isSelfDrive ? null : v.driverDlExpiry || null,
      rate_per_day: rate,
      duration_days: duration,
      routing: v.routing || null,
      domicile: v.domicile || null,
      status: "DRAFT",
      total_amount: total,
      amount_paid: v.amountPaid ? Number(v.amountPaid) : 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message ?? "Could not create the rental.");
  return { contractId: inserted.id };
}

/**
 * Check-out: keys handed over. Curfew-guarded. Logs the dispatch, flips the
 * car to TRIP and activates the contract clock.
 */
export async function checkoutContract(
  orgId: string,
  contractId: string,
  input: CheckoutInput
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const [{ data: contract }, { data: org }] = await Promise.all([
    supabase
      .from("contracts")
      .select("status, car_id, duration_days")
      .eq("id", contractId)
      .eq("org_id", orgId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("curfew_start, curfew_end")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  if (!contract) throw new Error("Contract not found.");
  if (contract.status !== "DRAFT") {
    throw new Error("Only draft contracts can be checked out.");
  }
  if (isInCurfew(new Date(), org?.curfew_start ?? null, org?.curfew_end ?? null)) {
    throw new Error(
      "Checkouts are locked during curfew hours. Try again after the lockout window."
    );
  }

  const start = new Date();
  const expiration = new Date(start.getTime() + contract.duration_days * 86400_000);

  const { error: logErr } = await supabase.from("checkout_logs").insert({
    org_id: orgId,
    contract_id: contractId,
    dispatched_by: user.id,
    mileage: v.mileage ? Number(v.mileage) : null,
    fuel_at_issue: v.fuel,
    signature: v.signature, // MVP: typed-name confirmation (biometric later)
  });
  if (logErr) throw new Error(logErr.message);

  const { error: contractErr } = await supabase
    .from("contracts")
    .update({
      status: "ACTIVE",
      contract_start: start.toISOString(),
      contract_expiration: expiration.toISOString(),
    })
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (contractErr) throw new Error(contractErr.message);

  await supabase.from("cars").update({ status: "TRIP" }).eq("id", contract.car_id).eq("org_id", orgId);
}

/**
 * Check-in: car back at base. Logs the return, applies the refuel penalty,
 * completes the contract, frees the car, and rolls any unpaid balance into
 * the client's debt.
 */
export async function checkinContract(
  orgId: string,
  contractId: string,
  input: CheckinInput
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = checkinSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const { data: contract } = await supabase
    .from("contracts")
    .select("status, car_id, client_id, total_amount, amount_paid")
    .eq("id", contractId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!contract) throw new Error("Contract not found.");
  if (contract.status !== "ACTIVE") {
    throw new Error("Only active contracts can be checked in.");
  }

  const penalty = v.refuelPenalty ? Number(v.refuelPenalty) : 0;

  const { error: logErr } = await supabase.from("checkin_logs").insert({
    org_id: orgId,
    contract_id: contractId,
    returned_by: v.returnedBy,
    received_by: user.id,
    mileage: v.mileage ? Number(v.mileage) : null,
    fuel_at_return: v.fuel,
    refuel_penalty: penalty,
  });
  if (logErr) throw new Error(logErr.message);

  const { error: contractErr } = await supabase
    .from("contracts")
    .update({ status: "COMPLETED", refuel_penalty: penalty })
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (contractErr) throw new Error(contractErr.message);

  await supabase.from("cars").update({ status: "AVAILABLE" }).eq("id", contract.car_id).eq("org_id", orgId);

  // Unpaid balance becomes client debt (blocks future rentals until cleared).
  const balance = (contract.total_amount ?? 0) + penalty - (contract.amount_paid ?? 0);
  if (balance > 0) {
    const { data: client } = await supabase
      .from("clients")
      .select("debt_owed")
      .eq("id", contract.client_id)
      .eq("org_id", orgId)
      .maybeSingle();
    await supabase
      .from("clients")
      .update({ debt_owed: Number(client?.debt_owed ?? 0) + balance })
      .eq("id", contract.client_id)
      .eq("org_id", orgId);
  }
}

/** Staff-entered rental extension: more days, new expiration, new total. */
export async function extendContract(
  orgId: string,
  contractId: string,
  input: { extraDays: string }
): Promise<void> {
  const { supabase } = await assertMember(orgId);

  const parsed = extendSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const extra = Number(parsed.data.extraDays);

  const { data: contract } = await supabase
    .from("contracts")
    .select("status, duration_days, rate_per_day, contract_expiration")
    .eq("id", contractId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!contract) throw new Error("Contract not found.");
  if (contract.status !== "ACTIVE") {
    throw new Error("Only active contracts can be extended.");
  }
  if (!contract.contract_expiration) {
    throw new Error("Check the contract out before extending it.");
  }

  const newDuration = contract.duration_days + extra;
  const newExpiration = new Date(
    new Date(contract.contract_expiration).getTime() + extra * 86400_000
  );

  const { error } = await supabase
    .from("contracts")
    .update({
      duration_days: newDuration,
      contract_expiration: newExpiration.toISOString(),
      total_amount: newDuration * Number(contract.rate_per_day),
    })
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

/** Record a payment. On completed contracts it also pays down client debt. */
export async function recordPayment(
  orgId: string,
  contractId: string,
  input: { amount: string }
): Promise<void> {
  const { supabase } = await assertMember(orgId);

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const amount = Number(parsed.data.amount);

  const { data: contract } = await supabase
    .from("contracts")
    .select("status, amount_paid, client_id")
    .eq("id", contractId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!contract) throw new Error("Contract not found.");
  if (contract.status === "CANCELLED") throw new Error("This contract was cancelled.");

  const { error } = await supabase
    .from("contracts")
    .update({ amount_paid: Number(contract.amount_paid ?? 0) + amount })
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);

  if (contract.status === "COMPLETED") {
    const { data: client } = await supabase
      .from("clients")
      .select("debt_owed")
      .eq("id", contract.client_id)
      .eq("org_id", orgId)
      .maybeSingle();
    const newDebt = Math.max(0, Number(client?.debt_owed ?? 0) - amount);
    await supabase
      .from("clients")
      .update({ debt_owed: newDebt })
      .eq("id", contract.client_id)
      .eq("org_id", orgId);
  }
}

/** Cancel a draft that never went out. */
export async function cancelContract(orgId: string, contractId: string): Promise<void> {
  const { supabase } = await assertMember(orgId);
  const { data: contract } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", contractId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!contract) throw new Error("Contract not found.");
  if (contract.status !== "DRAFT") throw new Error("Only drafts can be cancelled.");

  const { error } = await supabase
    .from("contracts")
    .update({ status: "CANCELLED" })
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

/** Latest checkout/checkin logs for the contract details sheet. */
export async function getContractLogs(
  orgId: string,
  contractId: string
): Promise<{ checkout: CheckoutLog | null; checkin: CheckinLog | null }> {
  const { supabase } = await assertMember(orgId);
  const [outRes, inRes] = await Promise.all([
    supabase
      .from("checkout_logs")
      .select("id, dispatched_by, mileage, fuel_at_issue, signature, created_at")
      .eq("org_id", orgId)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("checkin_logs")
      .select("id, returned_by, received_by, mileage, fuel_at_return, refuel_penalty, created_at")
      .eq("org_id", orgId)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  return {
    checkout: (outRes.data?.[0] ?? null) as CheckoutLog | null,
    checkin: (inRes.data?.[0] ?? null) as CheckinLog | null,
  };
}
