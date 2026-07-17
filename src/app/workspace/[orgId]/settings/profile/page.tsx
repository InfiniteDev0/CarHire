import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/settings/components/profile-form";

export const metadata = { title: "Profile · Settings · CarHire" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Profile</h2>
        <p className="text-xs text-muted-foreground">
          Your personal information and account security.
        </p>
      </div>
      <ProfileForm
        initialName={(user.user_metadata?.full_name as string) ?? ""}
        initialEmail={user.email ?? ""}
      />
    </div>
  );
}
