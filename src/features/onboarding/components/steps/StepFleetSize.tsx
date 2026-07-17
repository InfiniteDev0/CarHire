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
      <div className="flex w-full flex-col gap-3">
        {FLEET_SIZES.map((option) => {
          const Icon = option.icon;
          const selected = api.fleetSize === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => api.set("fleetSize", option.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-foreground bg-muted/50"
                  : "hover:border-muted-foreground/40 hover:bg-muted/30"
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg border",
                  selected ? "border-foreground/20 bg-background" : "bg-muted/50"
                )}
              >
                <Icon className="size-5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              {selected && (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
