import { create } from "zustand";
import type { MemberRole } from "@/lib/auth/membership";

/**
 * Client-side workspace/org context. Hydrated once per workspace load by
 * <WorkspaceStoreHydrator> (from server data) so deep client components can
 * read the current org + role without prop-drilling.
 */
export interface WorkspaceState {
  orgId: string | null;
  orgName: string | null;
  role: MemberRole | null;
  isAdmin: boolean;
  userName: string | null;
  userEmail: string | null;
  setWorkspace: (data: Partial<Omit<WorkspaceState, "setWorkspace">>) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  orgId: null,
  orgName: null,
  role: null,
  isAdmin: false,
  userName: null,
  userEmail: null,
  setWorkspace: (data) => set(data),
}));

// Convenience selectors.
export const useOrgId = () => useWorkspaceStore((s) => s.orgId);
export const useIsAdmin = () => useWorkspaceStore((s) => s.isAdmin);
