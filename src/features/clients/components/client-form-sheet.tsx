"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidePanel } from "@/components/workspace/side-panel";
import { clientSchema } from "@/lib/validation/client";
import { photoError } from "@/lib/storage";
import { createClientRecord, updateClientRecord } from "../actions";
import type { ClientRow } from "../types";

interface FormState {
  fullName: string;
  nationalId: string;
  kraPin: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  nokName: string;
  nokPhone: string;
  notes: string;
}

function initialFrom(c: ClientRow | null): FormState {
  return {
    fullName: c?.full_name ?? "",
    nationalId: c?.national_id ?? "",
    kraPin: c?.kra_pin ?? "",
    phone: c?.phone ?? "",
    secondaryPhone: c?.secondary_phone ?? "",
    email: c?.email ?? "",
    address: c?.address ?? "",
    nokName: c?.next_of_kin_name ?? "",
    nokPhone: c?.next_of_kin_phone ?? "",
    notes: c?.notes ?? "",
  };
}

const inputWrap = "flex flex-col gap-1.5";
const fileInputClass =
  "text-xs text-zinc-500 file:mr-2 file:rounded-md file:border file:border-zinc-700 file:bg-zinc-900 file:px-2.5 file:py-1 file:text-xs file:text-zinc-200";

export function ClientFormSheet({
  orgId,
  editing,
  open,
  onOpenChange,
}: {
  orgId: string;
  editing: ClientRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialFrom(editing));
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Re-seed whenever the sheet opens (render-time reset, no effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initialFrom(editing));
      setIdFront(null);
      setIdBack(null);
      setErrors({});
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function pickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    key: string
  ) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const err = photoError(file);
      if (err) {
        setErrors((prev) => ({ ...prev, [key]: err }));
        setFile(null);
        e.target.value = "";
        return;
      }
    }
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const result = clientSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.set(k, v));
      if (idFront) fd.set("idFront", idFront);
      if (idBack) fd.set("idBack", idBack);

      const res = editing
        ? await updateClientRecord(orgId, editing.id, fd)
        : await createClientRecord(orgId, fd);

      if (res.photoWarning) {
        toast.warning(`Saved, but ID photos failed: ${res.photoWarning}`);
      } else {
        toast.success(editing ? "Client updated" : "Client added");
      }
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editing ? "Edit client" : "New client"}</h2>
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={`${inputWrap} col-span-2`}>
            <Label htmlFor="fullName">Full name *</Label>
            <Input id="fullName" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="John Kamau" disabled={isLoading} aria-invalid={!!errors.fullName} />
            {errors.fullName && <span className="text-xs text-red-400">{errors.fullName}</span>}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="nationalId">National ID</Label>
            <Input id="nationalId" value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} placeholder="12345678" disabled={isLoading} />
          </div>
          <div className={inputWrap}>
            <Label htmlFor="kraPin">KRA PIN</Label>
            <Input id="kraPin" value={form.kraPin} onChange={(e) => set("kraPin", e.target.value)} placeholder="A012345678Z" disabled={isLoading} />
          </div>
          <div className={inputWrap}>
            <Label htmlFor="phone">Primary phone *</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+254 7XX XXX XXX" disabled={isLoading} aria-invalid={!!errors.phone} />
            {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="secondaryPhone">Secondary phone</Label>
            <Input id="secondaryPhone" type="tel" value={form.secondaryPhone} onChange={(e) => set("secondaryPhone", e.target.value)} placeholder="Fallback contact" disabled={isLoading} />
          </div>
          <div className={inputWrap}>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="client@example.com" disabled={isLoading} aria-invalid={!!errors.email} />
            {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="address">Residential address</Label>
            <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Estate, street…" disabled={isLoading} />
          </div>
        </div>

        {/* Next of kin */}
        <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
          <div className={inputWrap}>
            <Label htmlFor="nokName">Next of kin</Label>
            <Input id="nokName" value={form.nokName} onChange={(e) => set("nokName", e.target.value)} placeholder="Name" disabled={isLoading} />
          </div>
          <div className={inputWrap}>
            <Label htmlFor="nokPhone">Next of kin phone</Label>
            <Input id="nokPhone" type="tel" value={form.nokPhone} onChange={(e) => set("nokPhone", e.target.value)} placeholder="+254 …" disabled={isLoading} />
          </div>
        </div>

        {/* ID photos */}
        <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
          <div className={inputWrap}>
            <Label htmlFor="cIdFront">ID photo — front</Label>
            <input id="cIdFront" type="file" accept="image/*" disabled={isLoading} onChange={(e) => pickFile(e, setIdFront, "idFront")} className={fileInputClass} />
            {errors.idFront && <span className="text-xs text-red-400">{errors.idFront}</span>}
            {editing?.id_front_url && !idFront && (
              <span className="text-xs text-zinc-600">Already uploaded — pick a file to replace.</span>
            )}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="cIdBack">ID photo — back</Label>
            <input id="cIdBack" type="file" accept="image/*" disabled={isLoading} onChange={(e) => pickFile(e, setIdBack, "idBack")} className={fileInputClass} />
            {errors.idBack && <span className="text-xs text-red-400">{errors.idBack}</span>}
            {editing?.id_back_url && !idBack && (
              <span className="text-xs text-zinc-600">Already uploaded — pick a file to replace.</span>
            )}
          </div>
        </div>

        <div className={inputWrap}>
          <Label htmlFor="cNotes">Notes</Label>
          <Textarea id="cNotes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything worth flagging…" disabled={isLoading} />
        </div>

        <Button type="submit" className="mt-auto w-full rounded-sm" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {editing ? "Save changes" : "Add client"}
        </Button>
      </form>
    </SidePanel>
  );
}
