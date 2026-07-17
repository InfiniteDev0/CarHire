"use server";

import { createClient } from "@/lib/supabase/server";
import { expenseSchema, type ExpenseInput } from "@/lib/validation/expense";

/** Throw unless the caller is an active member of `orgId`. Returns their role. */
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
  return { supabase, user, role: data.role as string };
}

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Invalid details.";
}

/** Record a business expense (staff or admin), optionally tied to a car. */
export async function createExpense(orgId: string, input: ExpenseInput): Promise<void> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const { error } = await supabase.from("expenses").insert({
    org_id: orgId,
    car_id: v.carId || null,
    category: v.category,
    amount: Number(v.amount),
    incurred_on: v.incurredOn,
    note: v.note || null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
}

/** Edit an expense (staff or admin). */
export async function updateExpense(
  orgId: string,
  expenseId: string,
  input: ExpenseInput
): Promise<void> {
  const { supabase } = await assertMember(orgId);

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) throw new Error(firstIssue(parsed.error));
  const v = parsed.data;

  const { error } = await supabase
    .from("expenses")
    .update({
      car_id: v.carId || null,
      category: v.category,
      amount: Number(v.amount),
      incurred_on: v.incurredOn,
      note: v.note || null,
    })
    .eq("id", expenseId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}

/** Delete an expense — admin only (RLS enforces this too). */
export async function deleteExpense(orgId: string, expenseId: string): Promise<void> {
  const { supabase, role } = await assertMember(orgId);
  if (role !== "admin") throw new Error("Only admins can delete expenses.");

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}
