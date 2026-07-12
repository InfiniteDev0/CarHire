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

// Total number of steps in the wizard (the "Creating" screen is not counted).
export const TOTAL_STEPS = 4;
