export type OnboardingPlan = "FREE" | "PRO" | "BUSINESS";

// Shape of everything the CarHire onboarding wizard collects.
export interface OnboardingData {
  // Step 1 — identity
  name: string;

  // Step 2 — location & contact
  county: string;
  phone: string;

  // Step 3 — fleet size (organizations.fleet_size bucket)
  fleetSize: string | null;

  // Step 4 — invite co-admins (optional)
  inviteEmails: string[];

  // Step 5 — plan (workspace starts FREE; paid plans go through checkout)
  plan: OnboardingPlan;

  // Step 5 — operating rules (all optional)
  curfewStart: string; // "HH:MM" or ""
  curfewEnd: string;
  rateFloor: string; // kept as string in the form; parsed on submit
  rateCeiling: string;
}

export interface OnboardingState extends OnboardingData {
  currentStep: number;
  isSubmitting: boolean;
}

export interface OnboardingApi extends OnboardingState {
  /** Steps shown in this run — 5 for a first workspace, 4 when the plan step
   *  is skipped for an additional workspace (it inherits the paid plan). */
  totalSteps: number;
  set: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  addInviteEmail: (email: string) => boolean;
  removeInviteEmail: (email: string) => void;
  goNext: () => void;
  goBack: () => void;
  goToCreating: () => void;
  setSubmitting: (v: boolean) => void;
  canAdvance: () => boolean;
}
