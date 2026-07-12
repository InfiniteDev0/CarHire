"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { MemberRole } from "@/lib/auth/membership";

/**
 * Pushes server-fetched workspace context into the Zustand store. Rendered
 * (invisibly) inside the workspace layout. Uses the store's own setState (not
 * React setState) so it doesn't trip the set-state-in-effect rule.
 */
export function WorkspaceStoreHydrator({
  orgId,
  orgName,
  role,
  userName,
  userEmail,
}: {
  orgId: string;
  orgName: string;
  role: MemberRole | null;
  userName: string;
  userEmail: string;
}) {
  useEffect(() => {
    useWorkspaceStore.getState().setWorkspace({
      orgId,
      orgName,
      role,
      isAdmin: role === "admin",
      userName,
      userEmail,
    });
  }, [orgId, orgName, role, userName, userEmail]);

  return null;
}
