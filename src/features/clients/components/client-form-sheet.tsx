"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { SidePanel } from "@/components/workspace/side-panel";
import { clientSchema, type NextOfKin } from "@/lib/validation/client";
import { photoError } from "@/lib/storage";
import { createClientRecord, updateClientRecord } from "../actions";
import type { ClientRow } from "../types";

interface FormState {
  fullName: string;
  nationalId: string;
  dlNumber: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyKin = (): NextOfKin => ({ name: "", phone: "", relationship: "" });

function initialFrom(c: ClientRow | null): FormState {
  return {
    fullName: c?.full_name ?? "",
    nationalId: c?.national_id ?? "",
    dlNumber: c?.dl_number ?? "",
    phone: c?.phone ?? "",
    secondaryPhone: c?.secondary_phone ?? "",
    email: c?.email ?? "",
    address: c?.address ?? "",
    notes: c?.notes ?? "",
  };
}

function initialKins(c: ClientRow | null): NextOfKin[] {
  if (c?.next_of_kins && c.next_of_kins.length > 0) return c.next_of_kins;
  if (c?.next_of_kin_name || c?.next_of_kin_phone) {
    return [{ name: c.next_of_kin_name ?? "", phone: c.next_of_kin_phone ?? "", relationship: "" }];
  }
  return [emptyKin()];
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
  const [kins, setKins] = useState<NextOfKin[]>(() => initialKins(editing));
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [dlFront, setDlFront] = useState<File | null>(null);
  const [dlBack, setDlBack] = useState<File | null>(null);
  const [passport, setPassport] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Re-seed whenever the sheet opens (render-time reset, no effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initialFrom(editing));
      setKins(initialKins(editing));
      setIdFront(null);
      setIdBack(null);
      setDlFront(null);
      setDlBack(null);
      setPassport(null);
      setErrors({});
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setKin = (i: number, key: keyof NextOfKin, value: string) =>
    setKins((list) => list.map((k, idx) => (idx === i ? { ...k, [key]: value } : k)));

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

    const result = clientSchema.safeParse({ ...form, nextOfKins: kins });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      const first = result.error.issues[0];
      if (String(first?.path[0]) === "nextOfKins") {
        toast.error(first?.message ?? "Check the next of kin details.");
      }
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.set(k, v));
      fd.set("nextOfKins", JSON.stringify(kins));
      if (idFront) fd.set("idFront", idFront);
      if (idBack) fd.set("idBack", idBack);
      if (dlFront) fd.set("dlFront", dlFront);
      if (dlBack) fd.set("dlBack", dlBack);
      if (passport) fd.set("passport", passport);

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
            <Label htmlFor="nationalId">ID number</Label>
            <Input id="nationalId" value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} placeholder="12345678" disabled={isLoading} aria-invalid={!!errors.nationalId} />
            {errors.nationalId ? (
              <span className="text-xs text-red-400">{errors.nationalId}</span>
            ) : (
              <span className="text-xs text-zinc-600">Old ID, Maisha UPI, or alien card.</span>
            )}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="dlNumber">Driving licence (Smart DL)</Label>
            <Input id="dlNumber" value={form.dlNumber} onChange={(e) => set("dlNumber", e.target.value)} placeholder="DL-ABC1234" disabled={isLoading} aria-invalid={!!errors.dlNumber} />
            {errors.dlNumber && <span className="text-xs text-red-400">{errors.dlNumber}</span>}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="phone">Primary phone *</Label>
            <PhoneInput id="phone" value={(form.phone || undefined) as never} onChange={(value) => set("phone", value ?? "")} defaultCountry="KE" placeholder="7XX XXX XXX" disabled={isLoading} aria-invalid={!!errors.phone} />
            {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
          </div>
          <div className={inputWrap}>
            <Label htmlFor="secondaryPhone">Secondary phone</Label>
            <PhoneInput id="secondaryPhone" value={(form.secondaryPhone || undefined) as never} onChange={(value) => set("secondaryPhone", value ?? "")} defaultCountry="KE" placeholder="Fallback contact" disabled={isLoading} aria-invalid={!!errors.secondaryPhone} />
            {errors.secondaryPhone && <span className="text-xs text-red-400">{errors.secondaryPhone}</span>}
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
        <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
          <Label>Next of kin</Label>
          {kins.map((kin, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                <Input value={kin.name} onChange={(e) => setKin(i, "name", e.target.value)} placeholder="Name" disabled={isLoading} />
                <PhoneInput value={(kin.phone || undefined) as never} onChange={(value) => setKin(i, "phone", value ?? "")} defaultCountry="KE" placeholder="7XX XXX XXX" disabled={isLoading} />
                <Input value={kin.relationship} onChange={(e) => setKin(i, "relationship", e.target.value)} placeholder="Relationship" disabled={isLoading} />
              </div>
              {kins.length > 1 && (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setKins((list) => list.filter((_, idx) => idx !== i))}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                >
                  <Minus className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {kins.length < 5 && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setKins((list) => [...list, emptyKin()])}
              className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white"
            >
              <Plus className="size-3.5" />
              Add next of kin
            </button>
          )}
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

        {/* Optional documents — DL + passport */}
        <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
          <div>
            <Label>Optional documents</Label>
            <p className="text-xs text-zinc-600">
              Driving licence and passport — good to have for self-drive hires.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={inputWrap}>
              <Label htmlFor="cDlFront">DL — front</Label>
              <input id="cDlFront" type="file" accept="image/*" disabled={isLoading} onChange={(e) => pickFile(e, setDlFront, "dlFront")} className={fileInputClass} />
              {errors.dlFront && <span className="text-xs text-red-400">{errors.dlFront}</span>}
              {editing?.dl_front_url && !dlFront && (
                <span className="text-xs text-zinc-600">Already uploaded — pick a file to replace.</span>
              )}
            </div>
            <div className={inputWrap}>
              <Label htmlFor="cDlBack">DL — back</Label>
              <input id="cDlBack" type="file" accept="image/*" disabled={isLoading} onChange={(e) => pickFile(e, setDlBack, "dlBack")} className={fileInputClass} />
              {errors.dlBack && <span className="text-xs text-red-400">{errors.dlBack}</span>}
              {editing?.dl_back_url && !dlBack && (
                <span className="text-xs text-zinc-600">Already uploaded — pick a file to replace.</span>
              )}
            </div>
            <div className={`${inputWrap} col-span-2`}>
              <Label htmlFor="cPassport">Passport</Label>
              <input id="cPassport" type="file" accept="image/*" disabled={isLoading} onChange={(e) => pickFile(e, setPassport, "passport")} className={fileInputClass} />
              {errors.passport && <span className="text-xs text-red-400">{errors.passport}</span>}
              {editing?.passport_url && !passport && (
                <span className="text-xs text-zinc-600">Already uploaded — pick a file to replace.</span>
              )}
            </div>
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
