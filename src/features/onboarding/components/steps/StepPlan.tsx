"use client";

import { Check } from "lucide-react";
import type { OnboardingApi } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import { PLAN_OPTIONS } from "../../config/onboarding.config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function StepPlan({ api }: { api: OnboardingApi }) {
  return (
    <OnboardingLayout
      currentStep={5}
      onBack={api.goBack}
      onNext={api.goToCreating}
      nextDisabled={!api.canAdvance()}
      nextLabel="Create workspace"
      title="Pick your plan"
      subtitle="Start free — you can upgrade any time. Paid plans go to checkout after your workspace is created."
    >
      <div className="flex flex-col gap-3">
        {PLAN_OPTIONS.map((option) => {
          const selected = api.plan === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => api.set("plan", option.id)}
              className={cn(
                "relative flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
                selected
                  ? "border-foreground bg-muted/50"
                  : "hover:border-muted-foreground/40 hover:bg-muted/30"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{option.name}</span>
                  {option.recommended && (
                    <Badge className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{option.blurb}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-foreground">
                  {option.price}
                  {option.period && (
                    <span className="text-muted-foreground">{option.period}</span>
                  )}
                </span>
                {selected && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
