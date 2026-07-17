"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import type { OnboardingApi } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import { KENYA_COUNTIES } from "../../data/counties";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function StepLocation({ api }: { api: OnboardingApi }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KENYA_COUNTIES;
    return KENYA_COUNTIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  function pick(county: string) {
    api.set("county", county);
    setOpen(false);
    setQuery("");
  }

  const list = (
    <div className="flex-1 overflow-y-auto scrollbar-pill px-2">
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No county matches “{query}”.
        </p>
      ) : (
        filtered.map((c) => {
          const selected = api.county === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-muted",
                selected && "font-medium"
              )}
            >
              {c}
              {selected && <Check className="size-4 text-primary" />}
            </button>
          );
        })
      )}
    </div>
  );

  const search = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search county…"
        className="h-11 rounded-full pl-9"
      />
    </div>
  );

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
      <div className="flex w-full flex-col gap-4">
        {/* County — Sheet on desktop, Drawer on mobile */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Primary operating county</span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="h-11 w-full justify-between font-normal"
          >
            <span className={cn(!api.county && "text-muted-foreground")}>
              {api.county || "Select a county…"}
            </span>
            <ChevronDown className="size-4 opacity-50" />
          </Button>

          {isMobile ? (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader className="text-left">
                  <DrawerTitle>Select county</DrawerTitle>
                </DrawerHeader>
                {list}
                <DrawerFooter className="pt-2">{search}</DrawerFooter>
              </DrawerContent>
            </Drawer>
          ) : (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetContent side="right" className="w-80 gap-0 p-0 sm:max-w-sm">
                <SheetHeader className="border-b p-4">
                  <SheetTitle>Select county</SheetTitle>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col py-2">{list}</div>
                <div className="border-t p-4">{search}</div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Business phone — country dropdown defaults to Kenya */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted-foreground">Business phone</span>
          <PhoneInput
            value={(api.phone || undefined) as never}
            onChange={(value) => api.set("phone", value ?? "")}
            defaultCountry="KE"
            placeholder="7XX XXX XXX"
          />
          <span className="text-xs text-muted-foreground">
            Separate from your personal login — shown to staff and on contracts.
          </span>
        </div>
      </div>
    </OnboardingLayout>
  );
}
