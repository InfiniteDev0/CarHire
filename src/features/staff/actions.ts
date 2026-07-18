"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertUnderLimit } from "@/lib/limits";
import { formFile, uploadPhoto } from "@/lib/storage";
import { createStaffSchema } from "@/lib/validation/staff";

/** Throw unless the caller is an active admin of `orgId`. */
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
    throw new Error("Only admins can manage staff.");
  }
  return { supabase, user };
}

// Readable, reasonably strong temporary password (letters + digits).
function makeTempPassword() {
  const base = randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  return `${base.slice(0, 10)}${Math.floor(10 + Math.random() * 89)}`;
}

export interface CreateStaffResult {
  tempPassword: string;
  photoWarning?: string;
}

/**
 * Create a staff account (admin only). FormData fields: fullName, email,
 * phone, and optional idFront/idBack image files. Service-role Admin API
 * creates the auth user with a temp password (returned once), inserts the
 * org_members row, then uploads ID photos to the private staff-docs bucket.
 */
export async function createStaff(
  orgId: string,
  formData: FormData
): Promise<CreateStaffResult> {
  const { supabase } = await assertAdmin(orgId);
  await assertUnderLimit(supabase, orgId, "staff");

  const parsed = createStaffSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid details.");
  }
  const v = parsed.data;
  const idFront = formFile(formData, "idFront");
  const idBack = formFile(formData, "idBack");

  const admin = createAdminClient();
  const password = makeTempPassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    email: v.email,
    password,
    email_confirm: true, // let them sign in immediately with the temp password
    user_metadata: { full_name: v.fullName },
  });

  if (error || !created?.user) {
    const msg = error?.message ?? "";
    if (/already|exists|registered/i.test(msg)) {
      throw new Error("A user with this email already exists.");
    }
    throw new Error(msg || "Could not create the staff account.");
  }

  const { error: memberErr } = await admin.from("org_members").insert({
    org_id: orgId,
    user_id: created.user.id,
    role: "staff",
    is_active: true,
    full_name: v.fullName,
    email: v.email,
    phone: v.phone || null,
  });

  if (memberErr) {
    // Roll back the orphaned auth user so a retry can reuse the email.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    throw new Error(memberErr.message);
  }

  // Photos are best-effort: the account must survive an upload hiccup.
  let photoWarning: string | undefined;
  if (idFront || idBack) {
    try {
      const dir = `${orgId}/${created.user.id}`;
      const updates: Record<string, string> = {};
      if (idFront) {
        updates.id_front_url = await uploadPhoto(admin, "staff-docs", dir, "front", idFront);
      }
      if (idBack) {
        updates.id_back_url = await uploadPhoto(admin, "staff-docs", dir, "back", idBack);
      }
      const { error: photoErr } = await admin
        .from("org_members")
        .update(updates)
        .eq("org_id", orgId)
        .eq("user_id", created.user.id);
      if (photoErr) photoWarning = photoErr.message;
    } catch (e) {
      photoWarning = e instanceof Error ? e.message : "ID photo upload failed.";
    }
  }

  return { tempPassword: password, photoWarning };
}

/**
 * Remove a staff member from the workspace entirely (admin only). Their past
 * work keeps its attribution (created_by/recorded_by store the user id), but
 * they can no longer sign in to this workspace.
 */
export async function removeStaff(orgId: string, userId: string): Promise<void> {
  const { user } = await assertAdmin(orgId);
  if (userId === user.id) throw new Error("You can't remove yourself.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("role", "staff"); // guard: only staff rows, never an admin
  if (error) throw new Error(error.message);
}

export interface StaffActivityItem {
  id: string;
  kind:
    | "RENTAL"
    | "PAYMENT"
    | "CHECKOUT"
    | "CHECKIN"
    | "COMPLAINT"
    | "CLIENT"
    | "EXPENSE"
    | "VEHICLE";
  title: string;
  detail: string;
  at: string; // ISO
}

const kesFmt = (n: number) => `KES ${Number(n).toLocaleString()}`;

/**
 * Everything a member has done, newest first (admin only) — rentals created,
 * payments recorded, checkouts/checkins handled, complaints filed, clients
 * registered, expenses issued, vehicles added.
 */
export async function getStaffActivity(
  orgId: string,
  userId: string
): Promise<StaffActivityItem[]> {
  const { supabase } = await assertAdmin(orgId);
  const PER = 20;

  const [contracts, payments, checkouts, checkins, complaints, clients, expenses, cars] =
    await Promise.all([
      supabase
        .from("contracts")
        .select("id, created_at, rate_per_day, duration_days, clients(full_name), cars(reg_number)")
        .eq("org_id", orgId).eq("created_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("payments")
        .select("id, created_at, amount, kind, method, contracts(clients(full_name), cars(reg_number))")
        .eq("org_id", orgId).eq("recorded_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("checkout_logs")
        .select("id, created_at, contracts(cars(reg_number), clients(full_name))")
        .eq("org_id", orgId).eq("dispatched_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("checkin_logs")
        .select("id, created_at, contracts(cars(reg_number), clients(full_name))")
        .eq("org_id", orgId).eq("received_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("complaints")
        .select("id, created_at, type, cars(reg_number)")
        .eq("org_id", orgId).eq("created_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("clients")
        .select("id, created_at, full_name")
        .eq("org_id", orgId).eq("created_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("expenses")
        .select("id, created_at, amount, category, note, cars(reg_number)")
        .eq("org_id", orgId).eq("created_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
      supabase
        .from("cars")
        .select("id, created_at, reg_number, make, model")
        .eq("org_id", orgId).eq("created_by", userId)
        .order("created_at", { ascending: false }).limit(PER),
    ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const items: StaffActivityItem[] = [
    ...((contracts.data ?? []) as any[]).map((c) => ({
      id: `rental-${c.id}`,
      kind: "RENTAL" as const,
      title: `Created a rental — ${c.cars?.reg_number ?? "vehicle"}`,
      detail: `${c.clients?.full_name ?? "client"} · ${c.duration_days} days @ ${kesFmt(c.rate_per_day)}/day`,
      at: c.created_at,
    })),
    ...((payments.data ?? []) as any[]).map((p) => ({
      id: `pay-${p.id}`,
      kind: "PAYMENT" as const,
      title: `Recorded ${kesFmt(p.amount)} (${String(p.method ?? "CASH").toLowerCase()})`,
      detail: [p.contracts?.clients?.full_name, p.contracts?.cars?.reg_number]
        .filter(Boolean)
        .join(" · "),
      at: p.created_at,
    })),
    ...((checkouts.data ?? []) as any[]).map((l) => ({
      id: `out-${l.id}`,
      kind: "CHECKOUT" as const,
      title: `Checked out ${l.contracts?.cars?.reg_number ?? "a vehicle"}`,
      detail: l.contracts?.clients?.full_name ?? "",
      at: l.created_at,
    })),
    ...((checkins.data ?? []) as any[]).map((l) => ({
      id: `in-${l.id}`,
      kind: "CHECKIN" as const,
      title: `Checked in ${l.contracts?.cars?.reg_number ?? "a vehicle"}`,
      detail: l.contracts?.clients?.full_name ?? "",
      at: l.created_at,
    })),
    ...((complaints.data ?? []) as any[]).map((c) => ({
      id: `complaint-${c.id}`,
      kind: "COMPLAINT" as const,
      title: `Filed a complaint${c.cars?.reg_number ? ` on ${c.cars.reg_number}` : ""}`,
      detail: String(c.type ?? "").toLowerCase(),
      at: c.created_at,
    })),
    ...((clients.data ?? []) as any[]).map((c) => ({
      id: `client-${c.id}`,
      kind: "CLIENT" as const,
      title: `Registered client ${c.full_name}`,
      detail: "",
      at: c.created_at,
    })),
    ...((expenses.data ?? []) as any[]).map((e) => ({
      id: `expense-${e.id}`,
      kind: "EXPENSE" as const,
      title: `Issued expense ${kesFmt(e.amount)} (${String(e.category ?? "").toLowerCase()})`,
      detail: [e.cars?.reg_number, e.note].filter(Boolean).join(" · "),
      at: e.created_at,
    })),
    ...((cars.data ?? []) as any[]).map((c) => ({
      id: `car-${c.id}`,
      kind: "VEHICLE" as const,
      title: `Added vehicle ${c.reg_number}`,
      detail: [c.make, c.model].filter(Boolean).join(" "),
      at: c.created_at,
    })),
  ];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 60);
}

/** Activate / deactivate a staff member (admin only). Never hard-deletes. */
export async function setStaffActive(
  orgId: string,
  userId: string,
  active: boolean
): Promise<void> {
  await assertAdmin(orgId);
  const admin = createAdminClient();
  const { error } = await admin
    .from("org_members")
    .update({ is_active: active })
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("role", "staff"); // guard: only staff rows, never an admin
  if (error) throw new Error(error.message);
}
