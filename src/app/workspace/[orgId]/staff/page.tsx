import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { signPath } from "@/lib/storage";
import { AddStaffDialog } from "@/features/staff/components/add-staff-dialog";
import {
  StaffTable,
  type StaffMember,
  type StaffPhotoUrls,
} from "@/features/staff/components/staff-table";

export const metadata = { title: "Staff · CarHire" };

export default async function StaffPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { userId } = await requireAdmin(orgId); // admin-only

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("org_members")
    .select("user_id, role, is_active, full_name, email, phone, id_front_url, id_back_url, created_at")
    .eq("org_id", orgId)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  // Signed URLs for ID photos (member-read storage policy, 1h expiry).
  const rows = members ?? [];
  const photoUrls: Record<string, StaffPhotoUrls> = {};
  await Promise.all(
    rows
      .filter((m) => m.id_front_url || m.id_back_url)
      .map(async (m) => {
        const [front, back] = await Promise.all([
          signPath(supabase, "staff-docs", m.id_front_url),
          signPath(supabase, "staff-docs", m.id_back_url),
        ]);
        photoUrls[m.user_id] = { front, back };
      })
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Invite and manage the people who run this workspace.
          </p>
        </div>
        <AddStaffDialog orgId={orgId} />
      </div>

      <StaffTable
        orgId={orgId}
        currentUserId={userId}
        members={rows as StaffMember[]}
        photoUrls={photoUrls}
      />
    </div>
  );
}
