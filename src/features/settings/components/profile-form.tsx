"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserRound, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { passwordSchema, emailSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function ProfileForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) errs.fullName = "Enter your full name";
    const emailCheck = emailSchema.safeParse(email.trim());
    if (!emailCheck.success) errs.email = emailCheck.error.issues[0]?.message ?? "Invalid email";
    if (password) {
      const pwCheck = passwordSchema.safeParse(password);
      if (!pwCheck.success) errs.password = pwCheck.error.issues[0]?.message ?? "Weak password";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const emailChanged = email.trim() !== initialEmail;

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
        ...(emailChanged ? { email: email.trim() } : {}),
        ...(password ? { password } : {}),
      });
      if (error) {
        toast.error(authErrorMessage(error));
        return;
      }

      if (emailChanged) {
        toast.success("Check your new inbox to confirm the email change.");
      } else {
        toast.success("Profile saved");
      }
      setPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGlobalSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast.error(authErrorMessage(error));
        return;
      }
      router.replace("/auth");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{initials(fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{fullName || "Your name"}</p>
            <p className="text-xs text-muted-foreground">{initialEmail}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pFullName">Full name</Label>
          <div className="relative">
            <UserRound className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pFullName"
              className="pl-8"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSaving}
              aria-invalid={!!errors.fullName}
            />
          </div>
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pEmail">Email</Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pEmail"
              type="email"
              className="pl-8"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSaving}
              aria-invalid={!!errors.email}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Changing it sends a confirmation link to the new address.
          </p>
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pPassword">Password</Label>
          <div className="relative">
            <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="pPassword"
              type="password"
              className="pl-8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              autoComplete="new-password"
              disabled={isSaving}
              aria-invalid={!!errors.password}
            />
          </div>
          <p className="text-xs text-muted-foreground">Leave empty to keep your current one.</p>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>

      <Separator />

      {/* Danger zone */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Danger zone</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <p className="text-sm text-muted-foreground">
            Log out everywhere — mobile, tablet and any other browser.
          </p>
          <Button
            variant="outline"
            className="rounded-sm"
            disabled={isSigningOut}
            onClick={handleGlobalSignOut}
          >
            {isSigningOut && <Loader2 className="size-4 animate-spin" />}
            Log out of all sessions
          </Button>
        </div>
      </div>
    </div>
  );
}
