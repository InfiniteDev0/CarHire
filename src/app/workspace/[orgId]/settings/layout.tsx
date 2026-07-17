import { getMembership } from "@/lib/auth/membership";
import { SettingsNav } from "@/features/settings/components/settings-nav";

/**
 * Settings shell — page heading + secondary sidebar. Workspace sections are
 * admin-only (each page also guards server-side with requireAdmin).
 */
export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { membership } = await getMembership(orgId);
  const isAdmin = membership?.role === "admin" && membership.is_active;

  return (
    <div className="flex flex-col">
      <div
        className="space-y-1 rounded-t-2xl p-2 text-white"
        style={{
          backgroundImage: "url('/banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "top",
        }}
      >
        <h1 className="text-xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace configuration and your account.
        </p>
      </div>

      <div className="flex flex-col h-120  gap-6 md:flex-row">
        <SettingsNav orgId={orgId} isAdmin={isAdmin} />
        <div className="min-w-0 pt-2 overflow-y-scroll scrollbar-pill flex-1">{children}</div>
      </div>
    </div>
  );
}
