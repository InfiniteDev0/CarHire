import { redirect } from "next/navigation";
import { getMembership } from "@/lib/auth/membership";

export const metadata = { title: "Settings · CarHire" };

/** /settings lands on the first section the member can actually use. */
export default async function SettingsIndex({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { membership } = await getMembership(orgId);
  const isAdmin = membership?.role === "admin" && membership.is_active;
  redirect(`/workspace/${orgId}/settings/${isAdmin ? "general" : "profile"}`);
}
