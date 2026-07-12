"use client";

import { Check } from "lucide-react";
import type { OnboardingApi } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import { FLEET_SIZES } from "../../config/onboarding.config";
import { cn } from "@/lib/utils";

export function StepFleetSize({ api }: { api: OnboardingApi }) {
  return (
    <OnboardingLayout
      currentStep={3}
      onBack={api.goBack}
      onNext={api.goNext}
      nextDisabled={!api.canAdvance()}
      title="How big is your fleet?"
      subtitle="A rough estimate — this just helps us tune your workspace."
    >
      <div className="grid grid-cols-2 gap-3">
        {FLEET_SIZES.map((option) => {
          const Icon = option.icon;
          const selected = api.fleetSize === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => api.set("fleetSize", option.id)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
                selected
                  ? "border-white bg-white/5"
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
              )}
            >
              {selected && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-white text-black">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <Icon size={22} className="text-zinc-300" />
              <span className="font-medium text-white">{option.label}</span>
              <span className="text-xs text-zinc-500">{option.description}</span>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
