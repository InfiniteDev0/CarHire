"use server";

import { createClient } from "@/lib/supabase/server";
import { assertUnderLimit } from "@/lib/limits";
import {
  createContractSchema,
  checkoutSchema,
  checkinSchema,
  extendSchema,
  paymentSchema,
  composeRouting,
  type CreateContractInput,
  type CheckoutInput,
  type CheckinInput,
  type ExtendInput,
} from "@/lib/validation/contract";
import { tripReportSchema, type TripReportInput } from "@/lib/validation/trip-report";
import { sendPushToOrg } from "@/lib/push";
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
  return { supabase, user, isAdmin: data.role === "admin" };
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
  const { supabase, user, isAdmin } = await assertMember(orgId);
  await assertUnderLimit(supabase, orgId, "rentals");

  const parsed = createContractSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const [{ data: client }, { data: car }, { data: org }, { data: openContracts }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("is_blocked, debt_owed, full_name")
        .eq("id", v.clientId)
        .eq("org_id", orgId)
        .maybeSingle(),
      supabase
        .from("cars")
        .select("status, reg_number, deposit")
        .eq("id", v.carId)
        .eq("org_id", orgId)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("rate_floor, rate_ceiling")
        .eq("id", orgId)
        .maybeSingle(),
      supabase
        .from("contracts")
        .select("id, status")
        .eq("org_id", orgId)
        .eq("client_id", v.clientId)
        .in("status", ["DRAFT", "ACTIVE"]),
    ]);

  if (!client) throw new Error("Client not found.");
  if (client.is_blocked) {
    throw new Error(`${client.full_name} is blocked and cannot hire until unblocked.`);
  }
  if ((openContracts?.length ?? 0) > 0) {
    throw new Error(
      `${client.full_name} already has an open rental — one car per client until it's returned.`
    );
  }
  if (!car) throw new Error("Vehicle not found.");
  if (car.status !== "AVAILABLE") {
    throw new Error(`${car.reg_number} is not available right now.`);
  }

  // The pickup deposit is fixed per car by the admin; staff can't discount it.
  const deposit = Number(v.depositAmount);
  if (car.deposit != null && !isAdmin && deposit !== Number(car.deposit)) {
    throw new Error(
      `The deposit for ${car.reg_number} is KES ${Number(car.deposit).toLocaleString()} — only an admin can change it.`
    );
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
      routing: composeRouting(v.routeLegs) || null,
      domicile: v.domicile || null,
      status: "DRAFT",
      total_amount: total,
      amount_paid: deposit, // the deposit is the first money in
      deposit_amount: deposit,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) throw new Error(error?.message ?? "Could not create the rental.");

  // Ledger entry for the deposit — non-fatal if it fails, totals stay correct.
  if (deposit > 0) {
    await supabase.from("payments").insert({
      org_id: orgId,
      contract_id: inserted.id,
      amount: deposit,
      kind: "DEPOSIT",
      recorded_by: user.id,
    });
  }

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
      .select("status, car_id, client_id, duration_days")
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

  // One car per client: refuse if they already have a live trip.
  const { data: liveTrips } = await supabase
    .from("contracts")
    .select("id")
    .eq("org_id", orgId)
    .eq("client_id", contract.client_id)
    .eq("status", "ACTIVE")
    .neq("id", contractId);
  if ((liveTrips?.length ?? 0) > 0) {
    throw new Error("This client is already out with another car — check it in first.");
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

  await sendPushToOrg(orgId, {
    title: "Vehicle checked out",
    body: "A trip just started — keys handed over.",
    url: `/workspace/${orgId}/rentals`,
  });
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

  // Odometers only go forward: the return reading must beat the checkout one.
  if (v.mileage) {
    const { data: outLog } = await supabase
      .from("checkout_logs")
      .select("mileage")
      .eq("org_id", orgId)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const startKm = outLog?.mileage;
    if (startKm != null && Number(v.mileage) <= Number(startKm)) {
      throw new Error(
        `Return mileage must be higher than the checkout reading (${Number(startKm).toLocaleString()} km).`
      );
    }
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

  await sendPushToOrg(orgId, {
    title: "Vehicle returned",
    body: "A car is back at base and the contract is completed.",
    url: `/workspace/${orgId}/rentals`,
  });

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

/**
 * Rental extension. To authorize one, the client must first pay half of the
 * remaining balance — the admin can adjust that required amount, staff can't.
 * Every authorized extension is logged in contract_extensions.
 */
export async function extendContract(
  orgId: string,
  contractId: string,
  input: ExtendInput
): Promise<void> {
  const { supabase, user, isAdmin } = await assertMember(orgId);

  const parsed = extendSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const extra = Number(parsed.data.extraDays);
  const paid = Number(parsed.data.amountPaid || 0);

  const { data: contract } = await supabase
    .from("contracts")
    .select(
      "status, duration_days, rate_per_day, contract_expiration, total_amount, amount_paid, refuel_penalty"
    )
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

  // Payment gate: default is half the outstanding balance; admins may adjust.
  const balance = Math.max(
    0,
    Number(contract.total_amount ?? 0) +
      Number(contract.refuel_penalty ?? 0) -
      Number(contract.amount_paid ?? 0)
  );
  const halfBalance = Math.ceil(balance / 2);
  const required =
    isAdmin && parsed.data.requiredPayment !== ""
      ? Number(parsed.data.requiredPayment)
      : halfBalance;

  if (paid < required) {
    throw new Error(
      `Extension not authorized — the client must pay at least KES ${required.toLocaleString()} of the outstanding balance first.`
    );
  }

  const newDuration = contract.duration_days + extra;
  const newExpiration = new Date(
    new Date(contract.contract_expiration).getTime() + extra * 86400_000
  );

  const { error: logErr } = await supabase.from("contract_extensions").insert({
    org_id: orgId,
    contract_id: contractId,
    extra_days: extra,
    required_payment: required,
    amount_paid: paid,
    created_by: user.id,
  });
  if (logErr) throw new Error(logErr.message);

  if (paid > 0) {
    await supabase.from("payments").insert({
      org_id: orgId,
      contract_id: contractId,
      amount: paid,
      kind: "EXTENSION",
      recorded_by: user.id,
    });
  }

  await sendPushToOrg(orgId, {
    title: "Rental extended",
    body: `${extra} extra day(s) authorized — KES ${paid.toLocaleString()} collected.`,
    url: `/workspace/${orgId}/rentals`,
  });

  const { error } = await supabase
    .from("contracts")
    .update({
      duration_days: newDuration,
      contract_expiration: newExpiration.toISOString(),
      total_amount: newDuration * Number(contract.rate_per_day),
      amount_paid: Number(contract.amount_paid ?? 0) + paid,
    })
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

/** Record a payment. On completed contracts it also pays down client debt. */
export async function recordPayment(
  orgId: string,
  contractId: string,
  input: { amount: string; method?: string; reference?: string }
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const amount = Number(parsed.data.amount);
  const method = ["CASH", "MPESA", "CARD", "BANK", "OTHER"].includes(input.method ?? "")
    ? input.method
    : "CASH";
  const reference = (input.reference ?? "").trim().slice(0, 300) || null;

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

  await supabase.from("payments").insert({
    org_id: orgId,
    contract_id: contractId,
    amount,
    kind: "PAYMENT",
    method,
    reference,
    recorded_by: user.id,
  });

  await sendPushToOrg(orgId, {
    title: "Payment received",
    body: `KES ${amount.toLocaleString()} was recorded.`,
    url: `/workspace/${orgId}/financials`,
  });

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

/**
 * Cancel a draft that never went out — deleted outright (logs/extensions
 * cascade), so cancelled clutter never piles up in the list.
 */
export async function cancelContract(orgId: string, contractId: string): Promise<void> {
  const { supabase } = await assertMember(orgId);
  const { data: contract } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", contractId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!contract) throw new Error("Contract not found.");
  if (contract.status !== "DRAFT" && contract.status !== "CANCELLED") {
    throw new Error("Only drafts (or already-cancelled rentals) can be deleted.");
  }

  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

export interface TripReport {
  id: string;
  car_condition: string;
  client_rating: number | null;
  performance: string | null;
  damages: string | null;
  damage_plan: string | null;
  created_at: string;
}

/** The trip report for a completed contract (null if not filled yet). */
export async function getTripReport(
  orgId: string,
  contractId: string
): Promise<TripReport | null> {
  const { supabase } = await assertMember(orgId);
  const { data } = await supabase
    .from("trip_reports")
    .select("id, car_condition, client_rating, performance, damages, damage_plan, created_at")
    .eq("org_id", orgId)
    .eq("contract_id", contractId)
    .maybeSingle();
  return (data as TripReport | null) ?? null;
}

/** Create or update the trip report for a completed contract (staff/admin). */
export async function saveTripReport(
  orgId: string,
  contractId: string,
  input: TripReportInput
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = tripReportSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const { data: contract } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", contractId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!contract) throw new Error("Contract not found.");
  if (contract.status !== "COMPLETED") {
    throw new Error("Trip reports are filled once the trip is completed.");
  }

  const { error } = await supabase.from("trip_reports").upsert(
    {
      org_id: orgId,
      contract_id: contractId,
      car_condition: v.carCondition,
      client_rating: Number(v.clientRating),
      performance: v.performance || null,
      damages: v.damages || null,
      damage_plan: v.damagePlan || null,
      filled_by: user.id,
    },
    { onConflict: "contract_id" }
  );
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
