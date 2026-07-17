"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Download, Loader2, Pencil, Trash2, ReceiptText } from "lucide-react";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SidePanel } from "@/components/workspace/side-panel";
import { useIsAdmin } from "@/lib/store/workspace-store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  expenseSchema,
  type ExpenseCategory,
} from "@/lib/validation/expense";
import { createExpense, updateExpense, deleteExpense } from "../actions";

export interface ExpenseRow {
  id: string;
  car_id: string | null;
  category: ExpenseCategory;
  amount: number;
  incurred_on: string;
  note: string | null;
  cars: { reg_number: string } | null;
}

export interface ExpenseCarPick {
  id: string;
  label: string; // "KDA 421J · Toyota Axio"
}

const NONE = "__none";
const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

interface FormState {
  carId: string;
  category: ExpenseCategory;
  amount: string;
  incurredOn: string;
  note: string;
}

const emptyForm = (): FormState => ({
  carId: "",
  category: "FUEL",
  amount: "",
  incurredOn: today(),
  note: "",
});

export function ExpensesSection({
  orgId,
  expenses,
  carPicks,
}: {
  orgId: string;
  expenses: ExpenseRow[];
  carPicks: ExpenseCarPick[];
}) {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const monthTotal = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return expenses
      .filter((e) => new Date(e.incurred_on) >= start)
      .reduce((s, e) => s + Number(e.amount), 0);
  }, [expenses]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setPanelOpen(true);
  }

  function openEdit(e: ExpenseRow) {
    setEditing(e);
    setForm({
      carId: e.car_id ?? "",
      category: e.category,
      amount: String(e.amount),
      incurredOn: e.incurred_on.slice(0, 10),
      note: e.note ?? "",
    });
    setPanelOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    const parsed = expenseSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid details.");
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await updateExpense(orgId, editing.id, parsed.data);
        toast.success("Expense updated");
      } else {
        await createExpense(orgId, parsed.data);
        toast.success("Expense recorded");
      }
      router.refresh();
      setPanelOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteExpense(orgId, deleteTarget.id);
      toast.success("Expense deleted");
      router.refresh();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsDeleting(false);
    }
  }

  function exportCsv() {
    const header = "Date,Category,Vehicle,Amount (KES),Note";
    const lines = expenses.map((e) =>
      [
        e.incurred_on.slice(0, 10),
        EXPENSE_CATEGORY_LABELS[e.category],
        e.cars?.reg_number ?? "",
        Number(e.amount),
        `"${(e.note ?? "").replaceAll('"', '""')}"`,
      ].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium">Expenses</h2>
          <p className="text-xs text-muted-foreground">
            {kes(monthTotal)} spent this month.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {expenses.length > 0 && (
            <Button
              variant="outline"
              className="h-8 gap-1.5 rounded-sm text-xs"
              onClick={exportCsv}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          )}
          <Button className="h-8 gap-1.5 rounded-sm" onClick={openAdd}>
            <Plus className="size-4" />
            Add expense
          </Button>
        </div>
      </div>

      {/* Table */}
      {expenses.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <ReceiptText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No expenses recorded — fuel, service and repairs land here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
                <TableHead className="hidden md:table-cell">Note</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {shortDate(e.incurred_on)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{EXPENSE_CATEGORY_LABELS[e.category]}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {e.cars?.reg_number ?? "—"}
                  </TableCell>
                  <TableCell className="hidden max-w-60 truncate text-muted-foreground md:table-cell">
                    {e.note ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">{kes(e.amount)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-7 p-0"
                        onClick={() => openEdit(e)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(e)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / edit panel */}
      <SidePanel open={panelOpen} onClose={() => setPanelOpen(false)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? "Edit expense" : "Add expense"}</h2>
          <Button
            onClick={() => setPanelOpen(false)}
            className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v as ExpenseCategory)}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Vehicle (optional)</Label>
            <Select
              value={form.carId || NONE}
              onValueChange={(v) => set("carId", v === NONE ? "" : v)}
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
            <span className="text-xs text-zinc-600">
              Tie it to a car to track per-vehicle profitability.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eAmount">Amount (KES)</Label>
              <Input
                id="eAmount"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="3500"
                disabled={isSaving}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eDate">Date</Label>
              <Input
                id="eDate"
                type="date"
                value={form.incurredOn}
                onChange={(e) => set("incurredOn", e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eNote">Note (optional)</Label>
            <Textarea
              id="eNote"
              rows={4}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Oil change + brake pads at Kirinyaga Rd garage…"
              disabled={isSaving}
            />
          </div>

          <Button type="submit" className="mt-auto w-full rounded-sm" disabled={isSaving}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Record expense"}
          </Button>
        </form>
      </SidePanel>

      {/* Delete confirm (admin) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                `${EXPENSE_CATEGORY_LABELS[deleteTarget.category]} · ${kes(deleteTarget.amount)} on ${shortDate(deleteTarget.incurred_on)}. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
