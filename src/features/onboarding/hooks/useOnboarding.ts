"use client";

import { useCallback, useState } from "react";
import { TOTAL_STEPS } from "../config/onboarding.config";
import type { OnboardingApi, OnboardingData, OnboardingState } from "../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialState: OnboardingState = {
  name: "",
  county: "",
  phone: "",
  fleetSize: null,
  inviteEmails: [],
  curfewStart: "",
  curfewEnd: "",
  rateFloor: "",
  rateCeiling: "",
  currentStep: 1,
  isSubmitting: false,
};

// currentStep === TOTAL_STEPS + 1 → hand off to the CreatingWorkspace screen.
export function useOnboarding(): OnboardingApi {
  const [state, setState] = useState<OnboardingState>(initialState);

  const set = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const addInviteEmail = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) return false;
    let added = false;
    setState((prev) => {
      if (prev.inviteEmails.includes(trimmed)) return prev;
      added = true;
      return { ...prev, inviteEmails: [...prev.inviteEmails, trimmed] };
    });
    return added;
  }, []);

  const removeInviteEmail = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      inviteEmails: prev.inviteEmails.filter((e) => e !== email),
    }));
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.max(1, prev.currentStep - 1) }));
  }, []);

  const goToCreating = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: TOTAL_STEPS + 1 }));
  }, []);

  const setSubmitting = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting: v }));
  }, []);

  // Per-step gate for the Continue button. Only name + fleet size are required.
  const canAdvance = useCallback(() => {
    switch (state.currentStep) {
      case 1:
        return state.name.trim().length >= 2;
      case 3:
        return state.fleetSize !== null;
      default:
        return true; // location, invites, operating rules are all optional
    }
  }, [state]);

  return {
    ...state,
    set,
    addInviteEmail,
    removeInviteEmail,
    goNext,
    goBack,
    goToCreating,
    setSubmitting,
    canAdvance,
  };
}

export default useOnboarding;
