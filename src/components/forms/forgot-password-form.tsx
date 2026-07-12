"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { forgotSchema, validate } from "@/lib/validation/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import type { AuthFormProps } from "./types";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({ className, onSwitch, ...props }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;

    const fieldErrors = validate(forgotSchema, { email });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      // Don't reveal whether the email exists — always show the same success.
      if (error && error.code?.includes("rate_limit")) {
        toast.error(authErrorMessage(error));
        return;
      }
      setSent(true);
      toast.success("If that email exists, a reset link is on its way.");
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
        <MailCheck className="size-10 text-primary" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to <strong>{email}</strong>. The link
            opens a page where you can set a new password.
          </p>
        </div>
        <Button variant="outline" onClick={() => onSwitch?.("login")}>
          <ArrowLeft size={16} /> Back to login
        </Button>
      </div>
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      noValidate
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </Field>

        <button
          type="button"
          onClick={() => onSwitch?.("login")}
          className="mx-auto flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft size={14} /> Back to login
        </button>
      </FieldGroup>
    </form>
  );
}
