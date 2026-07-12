"use server";

import { createClient } from "@/lib/supabase/server";
import { complaintSchema, type ComplaintInput } from "@/lib/validation/complaint";

async function assertMember(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data } = await supabase
    .from("org_members")
    .select("is_active")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || !data.is_active) {
    throw new Error("You're not a member of this workspace.");
  }
  return { supabase, user };
}

/** File a complaint against a rental and/or vehicle (staff or admin). */
export async function createComplaint(
  orgId: string,
  input: ComplaintInput
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);

  const parsed = complaintSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid details.");
  }
  const v = parsed.data;

  // A contract link implies the car it was for.
  let carId = v.carId || null;
  if (v.contractId) {
    const { data: contract } = await supabase
      .from("contracts")
      .select("car_id")
      .eq("id", v.contractId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!contract) throw new Error("Rental not found.");
    carId = contract.car_id;
  }

  const { error } = await supabase.from("complaints").insert({
    org_id: orgId,
    contract_id: v.contractId || null,
    car_id: carId,
    type: v.type,
    description: v.description,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
}

export async function setComplaintResolved(
  orgId: string,
  complaintId: string,
  resolved: boolean
): Promise<void> {
  const { supabase } = await assertMember(orgId);
  const { error } = await supabase
    .from("complaints")
    .update({
      is_resolved: resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("id", complaintId)
    .eq("org_id", orgId);
  if (error) throw new Error(error.message);
}
