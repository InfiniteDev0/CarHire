import { getMembership } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { getStaffNames } from "@/lib/staff-names";
import { VehiclesGrid } from "@/features/vehicles/components/vehicles-grid";
import { VEHICLE_COLUMNS, type Vehicle } from "@/features/vehicles/types";

export const metadata = { title: "Vehicles · CarHire" };

export default async function VehiclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { orgId } = await params;
  const { new: newParam } = await searchParams;
  const { membership } = await getMembership(orgId);
  const isAdmin = membership?.role === "admin" && membership.is_active === true;

  const supabase = await createClient();
  const [{ data: cars }, staffNames] = await Promise.all([
    supabase
      .from("cars")
      .select(VEHICLE_COLUMNS)
      .eq("org_id", orgId)
      .is("decommissioned_at", null)
      .order("created_at", { ascending: false }),
    getStaffNames(supabase, orgId),
  ]);

  const fleet = (cars ?? []) as Vehicle[];

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1 flex justify-between items-center w-full">
        <h1 className="text-xl">Vehicles</h1>
        <p className="text-sm text-muted-foreground">
          Your total fleet is {fleet.length}.
        </p>
      </div>

      <VehiclesGrid
        orgId={orgId}
        isAdmin={isAdmin}
        cars={fleet}
        staffNames={staffNames}
        openFormOnLoad={!!newParam && isAdmin}
      />
    </div>
  );
}
