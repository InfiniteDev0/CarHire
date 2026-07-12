import {
  LayoutDashboard,
  Car,
  FileText,
  Users,
  UserRound,
  Wallet,
  TriangleAlert,
  Calendar,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export interface WorkspaceNavItem {
  title: string;
  segment: string; // "" = workspace home
  icon: LucideIcon;
}

// Single source of truth for both the sidebar and the header breadcrumb.
export const WORKSPACE_NAV_ITEMS: WorkspaceNavItem[] = [
  { title: "Home", segment: "", icon: LayoutDashboard },
  { title: "Vehicles", segment: "vehicles", icon: Car },
  { title: "Rentals", segment: "rentals", icon: FileText },
  { title: "Clients", segment: "clients", icon: UserRound },
  { title: "Staff", segment: "staff", icon: Users },
  { title: "Finance", segment: "financials", icon: Wallet },
  { title: "Complaints", segment: "complaints", icon: TriangleAlert },
  { title: "Calendar", segment: "calendar", icon: Calendar },
  { title: "Settings", segment: "settings", icon: Settings2 },
];

export function navItemUrl(base: string, item: WorkspaceNavItem) {
  return item.segment ? `${base}/${item.segment}` : base;
}
