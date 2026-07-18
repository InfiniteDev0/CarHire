"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertUnderLimit } from "@/lib/limits";
import { formFile, signPath, uploadPhoto } from "@/lib/storage";
import { clientSchema, normalizeKenyanPhone, type NextOfKin } from "@/lib/validation/client";
import type { ClientContract } from "./types";

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

function parseForm(formData: FormData) {
  let nextOfKins: NextOfKin[] = [];
  try {
    nextOfKins = JSON.parse(String(formData.get("nextOfKins") ?? "[]"));
  } catch {
    nextOfKins = [];
  }

  const parsed = clientSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    nationalId: String(formData.get("nationalId") ?? ""),
    dlNumber: String(formData.get("dlNumber") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    secondaryPhone: String(formData.get("secondaryPhone") ?? ""),
    email: String(formData.get("email") ?? ""),
    address: String(formData.get("address") ?? ""),
    nextOfKins,
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid details.");
  }
  return parsed.data;
}

function toRow(v: ReturnType<typeof parseForm>) {
  const kins = v.nextOfKins.filter((k) => k.name || k.phone);
  return {
    full_name: v.fullName,
    national_id: v.nationalId ? v.nationalId.trim().toUpperCase() : null, // null keeps the unique index happy
    dl_number: v.dlNumber ? v.dlNumber.trim().toUpperCase() : null,
    phone: normalizeKenyanPhone(v.phone),
    secondary_phone: v.secondaryPhone ? normalizeKenyanPhone(v.secondaryPhone) : null,
    email: v.email || null,
    address: v.address || null,
    next_of_kins: kins.map((k) => ({
      name: k.name,
      phone: k.phone ? normalizeKenyanPhone(k.phone) : "",
      relationship: k.relationship,
    })),
    // Legacy single next-of-kin columns mirror the first entry.
    next_of_kin_name: kins[0]?.name || null,
    next_of_kin_phone: kins[0]?.phone ? normalizeKenyanPhone(kins[0].phone) : null,
    notes: v.notes || null,
  };
}

async function uploadClientPhotos(
  orgId: string,
  clientId: string,
  formData: FormData
): Promise<{ updates: Record<string, string>; warning?: string }> {
  // National ID is the core document; DL front/back and passport are optional.
  const files: { field: string; column: string; name: string }[] = [
    { field: "idFront", column: "id_front_url", name: "front" },
    { field: "idBack", column: "id_back_url", name: "back" },
    { field: "dlFront", column: "dl_front_url", name: "dl-front" },
    { field: "dlBack", column: "dl_back_url", name: "dl-back" },
    { field: "passport", column: "passport_url", name: "passport" },
  ];
  const updates: Record<string, string> = {};
  const picked = files.filter((f) => formFile(formData, f.field));
  if (picked.length === 0) return { updates };

  try {
    const admin = createAdminClient();
    const dir = `${orgId}/${clientId}`;
    for (const f of picked) {
      const file = formFile(formData, f.field)!;
      updates[f.column] = await uploadPhoto(admin, "client-docs", dir, f.name, file);
    }
    return { updates };
  } catch (e) {
    return {
      updates,
      warning: e instanceof Error ? e.message : "Document upload failed.",
    };
  }
}

export interface SaveClientResult {
  clientId: string;
  photoWarning?: string;
}

export async function createClientRecord(
  orgId: string,
  formData: FormData
): Promise<SaveClientResult> {
  const { supabase, user } = await assertMember(orgId);
  await assertUnderLimit(supabase, orgId, "clients");
  const v = parseForm(formData);
  const row = toRow(v);

  // Is this client new or returning? Match on national ID or phone.
  const matchers: string[] = [`phone.eq.${row.phone}`];
  if (row.national_id) matchers.push(`national_id.eq.${row.national_id}`);
  const { data: existing } = await supabase
    .from("clients")
    .select("id, full_name, national_id, phone")
    .eq("org_id", orgId)
    .or(matchers.join(","))
    .limit(1);
  if (existing && existing.length > 0) {
    const hit = existing[0];
    const via = row.national_id && hit.national_id === row.national_id ? "ID number" : "phone";
    throw new Error(
      `${hit.full_name} is already registered with this ${via} — this is a returning client, open their profile instead.`
    );
  }

  const { data: inserted, error } = await supabase
    .from("clients")
    .insert({ org_id: orgId, created_by: user.id, ...row })
    .select("id")
    .single();
  if (error || !inserted) {
    throw new Error(
      /duplicate|unique/i.test(error?.message ?? "")
        ? "A client with this national ID already exists."
        : error?.message ?? "Could not create the client."
    );
  }

  const { updates, warning } = await uploadClientPhotos(orgId, inserted.id, formData);
  if (Object.keys(updates).length > 0) {
    await supabase.from("clients").update(updates).eq("id", inserted.id).eq("org_id", orgId);
  }

  return { clientId: inserted.id, photoWarning: warning };
}

export async function updateClientRecord(
  orgId: string,
  clientId: string,
  formData: FormData
): Promise<SaveClientResult> {
  const { supabase } = await assertMember(orgId);
  const v = parseForm(formData);

  const { updates: photoUpdates, warning } = await uploadClientPhotos(orgId, clientId, formData);
  const { error } = await supabase
    .from("clients")
    .update({ ...toRow(v), ...photoUpdates })
    .eq("id", clientId)
    .eq("org_id", orgId);
  if (error) {
    throw new Error(
      /duplicate|unique/i.test(error.message)
        ? "A client with this national ID already exists."
        : error.message
    );
  }

  return { clientId, photoWarning: warning };
}

/** Block / unblock a hirer (staff or admin, per the research spec). */
export async function setClientBlocked(
  orgId: string,
  clientId: string,
  blocked: boolean
): Promise<void> {
  const { supabase } = await assertMember(orgId);
  const { error } = await supabase
    .from("clients")
    .update({ is_blocked: blocked })
    .eq("id", clientId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

export interface ClientDocUrls {
  front: string | null;
  back: string | null;
  dlFront: string | null;
  dlBack: string | null;
  passport: string | null;
}

/** Signed URLs for a client's documents (member-read storage policy). */
export async function getClientPhotoUrls(
  orgId: string,
  clientId: string
): Promise<ClientDocUrls> {
  const { supabase } = await assertMember(orgId);
  const { data } = await supabase
    .from("clients")
    .select("id_front_url, id_back_url, dl_front_url, dl_back_url, passport_url")
    .eq("id", clientId)
    .eq("org_id", orgId)
    .maybeSingle();
  const [front, back, dlFront, dlBack, passport] = await Promise.all([
    signPath(supabase, "client-docs", data?.id_front_url),
    signPath(supabase, "client-docs", data?.id_back_url),
    signPath(supabase, "client-docs", data?.dl_front_url),
    signPath(supabase, "client-docs", data?.dl_back_url),
    signPath(supabase, "client-docs", data?.passport_url),
  ]);
  return { front, back, dlFront, dlBack, passport };
}

/** Rental history for the client details sheet. */
export async function getClientContracts(
  orgId: string,
  clientId: string
): Promise<ClientContract[]> {
  const { supabase } = await assertMember(orgId);
  const { data } = await supabase
    .from("contracts")
    .select(
      "id, status, rate_per_day, duration_days, total_amount, amount_paid, refuel_penalty, contract_start, contract_expiration, created_at, cars(reg_number, make, model)"
    )
    .eq("org_id", orgId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(25);
  return (data ?? []) as unknown as ClientContract[];
}
