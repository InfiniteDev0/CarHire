"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  CAR_RETURN_CONDITIONS,
  CAR_RETURN_CONDITION_LABELS,
  tripReportSchema,
  type CarReturnCondition,
} from "@/lib/validation/trip-report";
import { getTripReport, saveTripReport } from "../actions";
import type { ContractRow } from "../helpers";

export function TripReportDialog({
  orgId,
  contract,
  open,
  onOpenChange,
}: {
  orgId: string;
  contract: ContractRow;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [carCondition, setCarCondition] = useState<CarReturnCondition>("GOOD");
  const [clientRating, setClientRating] = useState(0);
  const [performance, setPerformance] = useState("");
  const [damages, setDamages] = useState("");
  const [damagePlan, setDamagePlan] = useState("");

  // Load the existing report (if any) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsFetching(true);
    getTripReport(orgId, contract.id)
      .then((r) => {
        if (cancelled) return;
        setCarCondition((r?.car_condition as CarReturnCondition) ?? "GOOD");
        setClientRating(r?.client_rating ?? 0);
        setPerformance(r?.performance ?? "");
        setDamages(r?.damages ?? "");
        setDamagePlan(r?.damage_plan ?? "");
      })
      .catch(() => {})
      .finally(() => !cancelled && setIsFetching(false));
    return () => {
      cancelled = true;
    };
  }, [open, orgId, contract.id]);

  async function handleSave() {
    if (isSaving) return;
    const input = {
      carCondition,
      clientRating: clientRating ? String(clientRating) : "",
      performance,
      damages,
      damagePlan,
    };
    const parsed = tripReportSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the report.");
      return;
    }
    setIsSaving(true);
    try {
      await saveTripReport(orgId, contract.id, parsed.data);
      toast.success("Trip report saved");
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Trip report — {contract.cars?.reg_number}</DialogTitle>
          <DialogDescription>
            How the trip went with {contract.clients?.full_name ?? "the client"} and how the
            car came back. Editable any time after completion.
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Car return condition</Label>
              <Select
                value={carCondition}
                onValueChange={(v) => setCarCondition(v as CarReturnCondition)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAR_RETURN_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CAR_RETURN_CONDITION_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Client rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setClientRating(n)}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "size-6 transition-colors",
                        n <= clientRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trPerformance">Client performance</Label>
              <Textarea
                id="trPerformance"
                rows={2}
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
                placeholder="Paid on time, communicated well, returned early…"
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trDamages">Damages</Label>
              <Textarea
                id="trDamages"
                rows={2}
                value={damages}
                onChange={(e) => setDamages(e.target.value)}
                placeholder="None, or e.g. scratched rear bumper, cracked side mirror…"
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trDamagePlan">How damages will be dealt with</Label>
              <Textarea
                id="trDamagePlan"
                rows={2}
                value={damagePlan}
                onChange={(e) => setDamagePlan(e.target.value)}
                placeholder="Client to cover repair quote, deducted from deposit…"
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button disabled={isSaving || isFetching || clientRating === 0} onClick={handleSave}>
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            Save report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
