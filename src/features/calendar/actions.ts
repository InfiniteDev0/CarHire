"use server";

import { createClient } from "@/lib/supabase/server";

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
  if (!data || !data.is_active) throw new Error("You're not a member of this workspace.");
  return { supabase, user };
}

export interface ReminderInput {
  title: string;
  note?: string;
  remindAt: string; // ISO
  contractId?: string | null;
  color?: string;
}

/** Create a calendar reminder (optionally with a note + linked rental). */
export async function createReminder(orgId: string, input: ReminderInput): Promise<void> {
  const { supabase, user } = await assertMember(orgId);
  const title = input.title?.trim();
  if (!title) throw new Error("Give the reminder a title.");
  if (!input.remindAt) throw new Error("Pick a date and time.");

  const { error } = await supabase.from("calendar_reminders").insert({
    org_id: orgId,
    title,
    note: input.note?.trim() || null,
    remind_at: new Date(input.remindAt).toISOString(),
    contract_id: input.contractId || null,
    color: input.color || "yellow",
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
}

/** Mark a reminder resolved / reopened. */
export async function resolveReminder(
  orgId: string,
  id: string,
  resolved: boolean
): Promise<void> {
  const { supabase } = await assertMember(orgId);
  const { error } = await supabase
    .from("calendar_reminders")
    .update({ resolved, resolved_at: resolved ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

/** Delete a reminder. */
export async function deleteReminder(orgId: string, id: string): Promise<void> {
  const { supabase } = await assertMember(orgId);
  const { error } = await supabase
    .from("calendar_reminders")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}
