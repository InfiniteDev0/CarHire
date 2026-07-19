"use client";

import { useOnboarding } from "../hooks/useOnboarding";
import { StepName } from "./steps/StepName";
import { StepLocation } from "./steps/StepLocation";
import { StepFleetSize } from "./steps/StepFleetSize";
import { StepInvite } from "./steps/StepInvite";
import { StepPlan } from "./steps/StepPlan";
import { CreatingWorkspace } from "./CreatingWorkspace";

/**
 * `isAdditional` = the user already has a workspace. Their plan step is skipped
 * (the new workspace inherits their paid plan), so the wizard is 4 steps, not 5.
 */
export default function OnboardingFlow({ isAdditional = false }: { isAdditional?: boolean }) {
  const api = useOnboarding(isAdditional ? 4 : 5);

  // Past the last step → run creation.
  if (api.currentStep > api.totalSteps || api.isSubmitting) {
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
      return isAdditional ? <StepName api={api} /> : <StepPlan api={api} />;
    default:
      return <StepName api={api} />;
  }
}
