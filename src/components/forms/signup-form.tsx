"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, validate } from "@/lib/validation/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import type { AuthFormProps } from "./types";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordStrength } from "./password-strength";

export function SignupForm({ className, onSwitch, ...props }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLoading) return;

    const values = { fullName, email, password };
    const fieldErrors = validate(signupSchema, values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.code === "user_already_exists" || error.code === "email_exists") {
          setErrors({ email: "An account with this email already exists." });
        }
        toast.error(authErrorMessage(error));
        return;
      }

      // Email confirmation ON → session is null until the user confirms.
      if (!data.session) {
        toast.success("Account created. Check your email to confirm and sign in.");
        onSwitch?.("login");
        return;
      }

      toast.success("Welcome to CarHire!");
      router.replace("/");
      router.refresh();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Get started with CarHire in under two minutes
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName}</p>
          )}
        </Field>

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
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch?.("login")}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Log in
          </button>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
