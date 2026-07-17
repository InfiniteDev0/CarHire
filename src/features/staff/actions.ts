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
