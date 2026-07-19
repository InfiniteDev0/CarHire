"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

/** "+ New business" with the Business-plan gate, shared by /select-org. */
export function NewWorkspaceButton({
  canCreateWorkspace,
  upgradeOrgId,
  workspaceMessage,
}: {
  canCreateWorkspace: boolean;
  upgradeOrgId: string;
  workspaceMessage: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (canCreateWorkspace) {
      router.push("/onboarding");
    } else {
      toast.error(workspaceMessage);
      router.push(`/workspace/${upgradeOrgId}/pricing`);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
    >
      <Plus className="size-4" />
      New business
    </button>
  );
}
