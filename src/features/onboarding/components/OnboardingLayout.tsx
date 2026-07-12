"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
}: OnboardingLayoutProps) {
  const showBack = !!onBack && currentStep > 1;

  return (
    <div className="relative flex min-h-svh flex-col bg-zinc-950 text-white">
      {/* Top bar: brand + progress */}
      <div className="flex items-center justify-between px-6 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-medium">
          <span className="flex size-7 items-center justify-center rounded-md bg-white text-black text-sm font-bold">
            C
          </span>
          CarHire
        </Link>
        <div className="flex items-center gap-4">
          <Progress
            value={(currentStep / TOTAL_STEPS) * 100}
            className="w-32 md:w-40"
          />
          <span className="whitespace-nowrap text-sm text-zinc-500">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Animated step content */}
      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex items-center justify-center">
                <img
                  src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg"
                  alt=""
                  className="size-12 mb-5 rounded-lg"
                />
              </div>
              <div className="mb-6 space-y-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-zinc-400">{subtitle}</p>
                )}
              </div>
              <div className="flex items-center justify-center">{children}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar: Back / Skip / Continue */}
      <div className="flex items-center justify-between px-6 py-6 md:px-8">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className={cn(
            "text-zinc-400 hover:text-white",
            !showBack && "invisible",
          )}
        >
          Back
        </Button>
        <div className="flex gap-3">
          {showSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              className="text-zinc-300 hover:text-white"
            >
              Skip for now
            </Button>
          )}
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isLoading}
            className="flex items-center gap-2 bg-white font-medium text-black hover:bg-zinc-200"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
