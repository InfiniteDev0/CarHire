"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TOTAL_STEPS } from "../config/onboarding.config";

interface OnboardingLayoutProps {
  currentStep: number;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Per-step visual for the right desktop panel. Falls back to a branded panel. */
  illustration?: ReactNode;
}

export function OnboardingLayout({
  currentStep,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  isLoading = false,
  showSkip = false,
  onSkip,
  title,
  subtitle,
  children,
  illustration,
}: OnboardingLayoutProps) {
  const showBack = !!onBack && currentStep > 1;

  return (
    <div className="grid min-h-svh gap-2 p-2 md:grid-cols-2">
      {/* Left: the form column */}
      <div className="flex flex-col">
        {/* Header: back chevron + segmented progress */}
        <header className="flex items-center gap-3 px-4 pt-3 md:mx-auto md:w-full md:max-w-md md:px-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              !showBack && "invisible"
            )}
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex flex-1 gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < currentStep ? "bg-foreground" : "bg-muted"
                )}
              />
            ))}
          </div>
        </header>

        {/* Step content */}
        <div className="flex flex-1 flex-col px-6 pt-8 md:items-center md:justify-center md:pt-0">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="mb-6 space-y-1.5 text-left">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h1>
                  {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                <div>{children}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer: full-width CTA + optional skip */}
        <footer className="flex flex-col gap-1 px-6 pb-6 pt-4 md:mx-auto md:w-full md:max-w-md md:px-0">
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="h-12 w-full gap-2 rounded-xl text-base font-medium md:h-11 md:rounded-lg"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {nextLabel}
          </Button>
          {showSkip && (
            <Button type="button" variant="ghost" onClick={onSkip} className="h-10 w-full">
              Skip for now
            </Button>
          )}
        </footer>
      </div>

      {/* Right: per-step illustration (desktop only) */}
      <div className="relative hidden overflow-hidden rounded-2xl md:block">
        {illustration ?? (
          <div className="flex size-full flex-col items-center justify-center gap-4 bg-linear-to-br from-primary/15 via-muted to-background">
            <Image src="/logo.png" alt="" width={56} height={56} className="rounded-2xl shadow-sm" />
            <div className="space-y-1 px-8 text-center">
              <p className="text-lg font-semibold text-foreground">Lenzro CarHire</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Fleet, clients and contracts — one workspace per business.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
