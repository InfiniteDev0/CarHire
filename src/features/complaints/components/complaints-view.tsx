"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, TriangleAlert, CheckCheck, Undo2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/workspace/side-panel";
import {
  COMPLAINT_TYPES,
  COMPLAINT_TYPE_LABELS,
  type ComplaintType,
} from "@/lib/validation/complaint";
import { createComplaint, setComplaintResolved } from "../actions";

export interface ComplaintRow {
  id: string;
  type: ComplaintType;
  description: string | null;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  created_by: string | null;
  cars: { reg_number: string; make: string | null; model: string | null } | null;
  contracts: { id: string; clients: { full_name: string } | null } | null;
}

export interface ComplaintContractPick {
  id: string;
  label: string; // "KDA 421J · John Kamau · ACTIVE"
}

export interface ComplaintCarPick {
  id: string;
  label: string; // "KDA 421J · Toyota Axio"
}

const NONE = "__none";
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

export function ComplaintsView({
  orgId,
  complaints,
  contractPicks,
  carPicks,
  staffNames,
}: {
  orgId: string;
  complaints: ComplaintRow[];
  contractPicks: ComplaintContractPick[];
  carPicks: ComplaintCarPick[];
  staffNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"OPEN" | "RESOLVED" | "ALL">("OPEN");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ComplaintType>("ALL");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // New-complaint form state
  const [contractId, setContractId] = useState("");
  const [carId, setCarId] = useState("");
  const [type, setType] = useState<ComplaintType>("MECHANICAL");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [prevFormOpen, setPrevFormOpen] = useState(formOpen);
  if (formOpen !== prevFormOpen) {
    setPrevFormOpen(formOpen);
    if (formOpen) {
      setContractId("");
      setCarId("");
      setType("MECHANICAL");
      setDescription("");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (filter === "OPEN" && c.is_resolved) return false;
      if (filter === "RESOLVED" && !c.is_resolved) return false;
      if (typeFilter !== "ALL" && c.type !== typeFilter) return false;
      if (!q) return true;
      return [c.description, c.cars?.reg_number, c.contracts?.clients?.full_name]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [complaints, filter, typeFilter, search]);

  function toggleResolved(c: ComplaintRow) {
    setPendingId(c.id);
    startTransition(async () => {
      try {
        await setComplaintResolved(orgId, c.id, !c.is_resolved);
        toast.success(c.is_resolved ? "Complaint reopened" : "Complaint resolved");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setPendingId(null);
      }
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await createComplaint(orgId, { contractId, carId, type, description });
      toast.success("Complaint filed");
      router.refresh();
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, car, client…"
            className="h-8 pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "ALL" | ComplaintType)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {COMPLAINT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {COMPLAINT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button className="h-8 gap-1.5 rounded-sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            New complaint
          </Button>
        </div>
      </div>

      {/* Open/Resolved pills */}
      <div className="flex gap-1.5">
        {(["OPEN", "RESOLVED", "ALL"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-input text-muted-foreground hover:text-foreground"
            )}
          >
            {f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <TriangleAlert className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {complaints.length === 0 ? "No complaints filed — smooth operations." : "Nothing matches this filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{COMPLAINT_TYPE_LABELS[c.type]}</Badge>
                  {c.cars && (
                    <span className="text-sm font-medium">{c.cars.reg_number}</span>
                  )}
                  {c.contracts?.clients && (
                    <span className="text-xs text-muted-foreground">
                      · {c.contracts.clients.full_name}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">· {fmt(c.created_at)}</span>
                  {c.created_by && staffNames?.[c.created_by] && (
                    <span className="text-xs text-muted-foreground">
                      · filed by {staffNames[c.created_by]}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                {c.is_resolved && c.resolved_at && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    Resolved {fmt(c.resolved_at)}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 gap-1 rounded-sm text-xs"
                disabled={pendingId === c.id}
                onClick={() => toggleResolved(c)}
              >
                {pendingId === c.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : c.is_resolved ? (
                  <Undo2 className="size-3.5" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                {c.is_resolved ? "Reopen" : "Resolve"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* New complaint sheet */}
      <SidePanel open={formOpen} onClose={() => setFormOpen(false)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New complaint</h2>
          <Button
            onClick={() => setFormOpen(false)}
            className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Linked rental (optional)</Label>
            <Select
              value={contractId || NONE}
              onValueChange={(v) => setContractId(v === NONE ? "" : v)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {contractPicks.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-zinc-600">Picking a rental links the car automatically.</span>
          </div>

          {!contractId && (
            <div className="flex flex-col gap-1.5">
              <Label>Vehicle</Label>
              <Select
                value={carId || NONE}
                onValueChange={(v) => setCarId(v === NONE ? "" : v)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {carPicks.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ComplaintType)} disabled={isSaving}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLAINT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {COMPLAINT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cDescription">What happened?</Label>
            <Textarea
              id="cDescription"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breakdown on the Nakuru highway, fuel gauge dispute at return…"
              disabled={isSaving}
            />
          </div>

          <Button type="submit" className="mt-auto w-full rounded-sm" disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            File complaint
          </Button>
        </form>
      </SidePanel>
    </div>
  );
}
