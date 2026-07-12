"use client";

import type { OnboardingApi } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import { Input } from "@/components/ui/input";

export function StepName({ api }: { api: OnboardingApi }) {
  return (
    <OnboardingLayout
      currentStep={1}
      onNext={api.goNext}
      nextDisabled={!api.canAdvance()}
      title="What's your car-hire business called?"
      subtitle="This is the name of your workspace. You can change it later."
    >
      <Input
        autoFocus
        value={api.name}
        onChange={(e) => api.set("name", e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && api.canAdvance()) api.goNext();
        }}
        placeholder="e.g. Acme Car Hire"
        className="w-100 text-center text-lg text-white placeholder:text-zinc-600"
      />
    </OnboardingLayout>
  );
}
