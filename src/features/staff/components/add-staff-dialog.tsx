"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createStaff } from "../actions";
import { createStaffSchema } from "@/lib/validation/staff";
import { photoError } from "@/lib/storage";

function validate(values: { fullName: string; email: string; phone: string }) {
  const result = createStaffSchema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function AddStaffDialog({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setFullName("");
    setEmail("");
    setPhone("");
    setIdFront(null);
    setIdBack(null);
    setErrors({});
    setTempPassword(null);
    setCopied(false);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function pickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    set: (f: File | null) => void,
    key: string
  ) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const err = photoError(file);
      if (err) {
        setErrors((prev) => ({ ...prev, [key]: err }));
        set(null);
        e.target.value = "";
        return;
      }
    }
    setErrors((prev) => ({ ...prev, [key]: "" }));
    set(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const values = { fullName, email, phone };
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.set("fullName", fullName);
      fd.set("email", email);
      fd.set("phone", phone);
      if (idFront) fd.set("idFront", idFront);
      if (idBack) fd.set("idBack", idBack);

      const result = await createStaff(orgId, fd);
      setTempPassword(result.tempPassword);
      if (result.photoWarning) {
        toast.warning(`Account created, but ID photos failed: ${result.photoWarning}`);
      } else {
        toast.success("Staff member added");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyPassword() {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const fileInputClass =
    "text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-8 gap-1.5">
          <UserPlus className="size-4" />
          Add staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Staff account created</DialogTitle>
              <DialogDescription>
                Share these credentials with <strong>{fullName}</strong>. They can
                change the password from the sidebar menu after signing in. This
                password won&apos;t be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{email}</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">Temporary password</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-base">{tempPassword}</code>
                  <Button type="button" variant="outline" size="icon-sm" onClick={copyPassword}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Add a staff member</DialogTitle>
              <DialogDescription>
                They&apos;ll get an account with a temporary password you can share.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  disabled={isLoading}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Phone (optional)</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  disabled={isLoading}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="idFront">ID photo — front</FieldLabel>
                  <input
                    id="idFront"
                    type="file"
                    accept="image/*"
                    disabled={isLoading}
                    onChange={(e) => pickFile(e, setIdFront, "idFront")}
                    className={fileInputClass}
                  />
                  {errors.idFront && <p className="text-xs text-destructive">{errors.idFront}</p>}
                </Field>
                <Field>
                  <FieldLabel htmlFor="idBack">ID photo — back</FieldLabel>
                  <input
                    id="idBack"
                    type="file"
                    accept="image/*"
                    disabled={isLoading}
                    onChange={(e) => pickFile(e, setIdBack, "idBack")}
                    className={fileInputClass}
                  />
                  {errors.idBack && <p className="text-xs text-destructive">{errors.idBack}</p>}
                </Field>
              </div>
            </FieldGroup>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Create account
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
