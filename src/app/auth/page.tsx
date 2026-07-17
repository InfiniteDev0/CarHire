"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { LoginForm } from "@/components/forms/login-form";
import { SignupForm } from "@/components/forms/signup-form";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import type { AuthMode } from "@/components/forms/types";

function AuthForms({ mode, setMode }: { mode: AuthMode; setMode: (m: AuthMode) => void }) {
  return (
    <div
      key={mode}
      className="w-full max-w-xs animate-in fade-in-0 slide-in-from-right-3 duration-300"
    >
      {mode === "login" && <LoginForm onSwitch={setMode} />}
      {mode === "signup" && <SignupForm onSwitch={setMode} />}
      {mode === "forgot" && <ForgotPasswordForm onSwitch={setMode} />}
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  // Mobile-only: hero screen with a single CTA, then the auth form swipes in.
  // Lazy-init so a bounced-back error (e.g. expired reset link) skips the
  // hero and opens straight to the form — no extra render needed.
  const [started, setStarted] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("error")
  );

  // Surface errors bounced back from /auth/callback (e.g. expired reset link).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      toast.error(error);
      window.history.replaceState({}, "", "/auth");
    }
  }, []);

  return (
    <>
      {/* ── Mobile: hero → swipe-in auth ─────────────────────────────────── */}
      <div className="relative min-h-svh overflow-hidden lg:hidden">
        {/* Hero panel */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col justify-end p-6 transition-transform duration-300 ease-out",
            started && "-translate-x-full"
          )}
        >
          <Image
            src="/car.webp"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/10" />

          <div className="relative flex flex-col gap-6 text-white">
            <span className="flex items-center gap-2 font-medium">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-md" />
              Lenzro CarHire
            </span>
            <div className="space-y-1">
              <p className="text-2xl font-semibold">Run your fleet from your phone.</p>
              <p className="text-sm text-white/80">
                Fleet, clients and contracts — one workspace per business.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="w-full rounded-full bg-white py-3.5 text-center font-medium text-black transition-opacity active:opacity-80"
            >
              Get started
            </button>
          </div>
        </div>

        {/* Auth panel */}
        <div
          className={cn(
            "absolute inset-0 flex translate-x-full flex-col gap-4 bg-background p-6 transition-transform duration-300 ease-out",
            started && "translate-x-0"
          )}
        >
          <button
            type="button"
            onClick={() => setStarted(false)}
            aria-label="Back"
            className="-ml-2 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="flex flex-1 items-center justify-center">
            <AuthForms mode={mode} setMode={setMode} />
          </div>
        </div>
      </div>

      {/* ── Desktop: split screen, forms always visible ──────────────────── */}
      <div className="hidden min-h-svh lg:grid lg:grid-cols-2 lg:p-2">
        <div className="relative hidden overflow-hidden rounded-lg lg:block">
          <Image
            src="/car.webp"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <p className="text-lg font-medium">Lenzro CarHire</p>
            <p className="text-sm text-white/80">
              Fleet, clients and contracts — one workspace per business.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <span className="flex items-center gap-2 font-medium">
              <span className="flex size-8 items-center justify-center overflow-hidden text-primary-foreground">
                <Image src="/logo.png" alt="" width={32} height={32} className="rounded-md" />
              </span>
              Lenzro CarHire
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <AuthForms mode={mode} setMode={setMode} />
          </div>
        </div>
      </div>
    </>
  );
}
