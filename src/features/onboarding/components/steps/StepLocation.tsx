"use client";

import * as React from "react";
import type { OnboardingApi } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import { KENYA_COUNTIES } from "../../data/counties";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";

export function StepLocation({ api }: { api: OnboardingApi }) {
  const [open, setOpen] = React.useState(false);
  const [selectedCounty, setSelectedCounty] = React.useState(api.county || "");

  function handleConfirm() {
    if (selectedCounty) {
      api.set("county", selectedCounty);
      setOpen(false);
    }
  }

  // Safaricom/Airtel local format: 9 digits after +254, first must be 7 or 1.
  function handlePhone(raw: string) {
    let digits = raw.replace(/\D/g, "").slice(0, 9);
    if (digits.length > 0 && digits[0] !== "7" && digits[0] !== "1") {
      digits = "";
    }
    api.set("phone", digits);
  }

  return (
    <OnboardingLayout
      currentStep={2}
      onBack={api.goBack}
      onNext={api.goNext}
      showSkip
      onSkip={api.goNext}
      title="Where do you operate?"
      subtitle="Your home base and a contact number for the business."
    >
      <div className="flex flex-col gap-4">
        {/* County Sheet */}
        <Label className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-400">
            Primary operating county
          </span>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="w-full"
              render={
                <Button
                  variant="outline"
                  className="h-8 w-full justify-between border-zinc-800 bg-zinc-900 text-white"
                />
              }
            >
              {api.county || "Select a county…"}
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Select your county</SheetTitle>
                <SheetDescription>
                  Choose the county where your business operates.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto scrollbar-pill p-4">
                <RadioGroup
                  value={selectedCounty}
                  onValueChange={setSelectedCounty}
                  className="gap-2"
                >
                  {KENYA_COUNTIES.map((c) => (
                    <FieldLabel key={c} htmlFor={`county-${c}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{c}</FieldTitle>
                        </FieldContent>
                        <RadioGroupItem value={c} id={`county-${c}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </div>
              <SheetFooter>
                <Button onClick={handleConfirm} className="h-[34px]">
                  Confirm County
                </Button>
                <SheetClose
                  className="w-full"
                  render={<Button variant="outline" className="w-full" />}
                >
                  Cancel
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </Label>

        {/* Phone Input */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-400">Business phone</span>
          <div className="flex gap-2 w-full">
            <Button className="w-fit">+254</Button>
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={9}
              value={api.phone}
              onChange={(e) => handlePhone(e.target.value)}
              placeholder="7XX XXX XXX"
              className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600"
            />
          </div>
          {api.phone.length > 0 && api.phone.length < 9 ? (
            <span className="text-xs text-amber-500">
              Enter all 9 digits (starts with 7 or 1).
            </span>
          ) : (
            <span className="text-xs text-zinc-600">
              Separate from your personal login — shown to staff and on contracts.
            </span>
          )}
        </label>
      </div>
    </OnboardingLayout>
  );
}
