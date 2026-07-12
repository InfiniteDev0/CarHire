"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { LoginForm } from "@/components/forms/login-form";
import { SignupForm } from "@/components/forms/signup-form";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import type { AuthMode } from "@/components/forms/types";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");

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
    <div className="grid min-h-svh lg:grid-cols-2 lg:p-2">
      {/* Left: brand / imagery */}
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

      {/* Right: auth forms */}
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
          <div className="w-full max-w-xs">
            {/* key={mode} remounts on switch so tw-animate-css replays the entrance */}
            <div
              key={mode}
              className="animate-in fade-in-0 slide-in-from-right-3 duration-300"
            >
              {mode === "login" && <LoginForm onSwitch={setMode} />}
              {mode === "signup" && <SignupForm onSwitch={setMode} />}
              {mode === "forgot" && <ForgotPasswordForm onSwitch={setMode} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
