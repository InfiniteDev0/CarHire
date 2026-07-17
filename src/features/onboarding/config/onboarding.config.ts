import type { LucideIcon } from "lucide-react";
import { Car, Truck, Building2 } from "lucide-react";

// Fleet-size buckets — stored on organizations.fleet_size.
export interface FleetSizeOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const FLEET_SIZES: FleetSizeOption[] = [
  { id: "1-5",   label: "1–5 cars",   description: "Just getting started", icon: Car },
  { id: "6-20",  label: "6–20 cars",  description: "A growing fleet",      icon: Truck },
  { id: "21-50", label: "21–50 cars", description: "Established operation", icon: Building2 },
  { id: "50+",   label: "50+ cars",   description: "Large fleet",          icon: Building2 },
];

// Plan options shown on the final step. Free is recommended to start —
// paid plans route through /pricing/checkout after the workspace exists.
import type { OnboardingPlan } from "../types";

export interface PlanOption {
  id: OnboardingPlan;
  name: string;
  price: string;
  period?: string;
  blurb: string;
  recommended?: boolean;
}

export const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "FREE",
    name: "Free",
    price: "KES 0",
    blurb: "5 vehicles, 5 staff, 5 clients — perfect to start",
    recommended: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "KES 2,500",
    period: "/month",
    blurb: "Unlimited vehicles, staff and clients",
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "KES 6,000",
    period: "/month",
    blurb: "Everything in Pro + multiple workspaces",
  },
];

// Total number of steps in the wizard (the "Creating" screen is not counted).
export const TOTAL_STEPS = 5;
