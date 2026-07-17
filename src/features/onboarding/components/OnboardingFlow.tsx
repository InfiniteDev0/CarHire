"use client";

import { useOnboarding } from "../hooks/useOnboarding";
import { TOTAL_STEPS } from "../config/onboarding.config";
import { StepName } from "./steps/StepName";
import { StepLocation } from "./steps/StepLocation";
import { StepFleetSize } from "./steps/StepFleetSize";
import { StepInvite } from "./steps/StepInvite";
import { StepPlan } from "./steps/StepPlan";
import { CreatingWorkspace } from "./CreatingWorkspace";

export default function OnboardingFlow() {
  const api = useOnboarding();

  // Past the last step → run creation.
  if (api.currentStep > TOTAL_STEPS || api.isSubmitting) {
    return <CreatingWorkspace api={api} />;
  }

  switch (api.currentStep) {
    case 1:
      return <StepName api={api} />;
    case 2:
      return <StepLocation api={api} />;
    case 3:
      return <StepFleetSize api={api} />;
    case 4:
      return <StepInvite api={api} />;
    case 5:
      return <StepPlan api={api} />;
    default:
      return <StepName api={api} />;
  }
}
