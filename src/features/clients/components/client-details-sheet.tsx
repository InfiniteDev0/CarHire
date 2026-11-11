"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, Ban, ShieldAlert, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/workspace/side-panel";
import { setClientBlocked } from "../actions";
import type { ClientRow, ClientContract } from "../types";
import { money } from "@/lib/money";

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "rentals", label: "Rentals" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 py-2 last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value || "—"}</span>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-foreground",
  ACTIVE: "bg-green-500/10 text-green-600 dark:text-green-400",
  OVERDUE: "bg-red-500/10 text-red-600 dark:text-red-400",
  COMPLETED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function ClientDetailsSheet({
  orgId,
  client,
  open,
  onOpenChange,
  photos,
  contracts,
  onEdit,
  staffNames,
}: {
  orgId: string;
  client: ClientRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: {
    front: string | null;
    back: string | null;
    dlFront: string | null;
    dlBack: string | null;
    passport: string | null;
  } | null;
  contracts: ClientContract[] | null; // null = still loading
  onEdit: (c: ClientRow) => void;
  staffNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("profile");
  const [isPending, startTransition] = useTransition();

  // Reset tab when a different client opens (render-time reset).
  const [lastId, setLastId] = useState(client?.id);
  if (client?.id !== lastId) {
    setLastId(client?.id);
    setTab("profile");
  }

  if (!client) return null;

  // Money still owed on live (ACTIVE) rentals — noted on the client, distinct
  // from debt_owed which only accrues at check-in.
  const activeBalance = (contracts ?? [])
    .filter((c) => c.status === "ACTIVE")
    .reduce(
      (s, c) =>
        s +
        Math.max(
          0,
          Number(c.total_amount ?? 0) + Number(c.refuel_penalty ?? 0) - Number(c.amount_paid ?? 0)
        ),
      0
    );

  function toggleBlocked() {
    if (!client) return;
    startTransition(async () => {
      try {
        await setClientBlocked(orgId, client.id, !client.is_blocked);
        toast.success(client.is_blocked ? "Client unblocked" : "Client blocked");
        router.refresh();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      {/* Top */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-muted p-0 text-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </Button>
        {client.is_blocked ? (
          <Badge className="border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">Blocked</Badge>
        ) : (
          <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            In good standing
          </Badge>
        )}
      </div>

      {/* Identity */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <UserRound className="size-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{client.full_name}</h1>
          <p className="text-xs text-muted-foreground">
            {client.phone || "no phone"} · joined {shortDate(client.created_at)}
            {client.created_by && staffNames?.[client.created_by] && (
              <> · registered by {staffNames[client.created_by]}</>
            )}
          </p>
        </div>
        {(client.debt_owed > 0 || activeBalance > 0) && (
          <div className="shrink-0 text-right">
            {client.debt_owed > 0 && (
              <>
                <p className="text-xs text-muted-foreground">Debt owed</p>
                <p className="font-bold text-red-600 dark:text-red-400">{money(client.debt_owed)}</p>
              </>
            )}
            {activeBalance > 0 && (
              <>
                <p className="text-xs text-muted-foreground">Owing on active rental</p>
                <p className="font-bold text-amber-600 dark:text-amber-400">{money(activeBalance)}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative whitespace-nowrap pb-2 text-sm font-medium transition-colors",
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 text-sm text-muted-foreground">
        {tab === "profile" && (
          <div className="flex flex-col gap-4">
            <div>
              <InfoRow label="ID number" value={client.national_id} />
              <InfoRow label="Driving licence" value={client.dl_number} />
              <InfoRow label="Primary phone" value={client.phone} />
              <InfoRow label="Secondary phone" value={client.secondary_phone} />
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Address" value={client.address} />
            </div>

            {/* Next of kin */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next of kin
              </p>
              {(client.next_of_kins?.length
                ? client.next_of_kins
                : client.next_of_kin_name
                  ? [{ name: client.next_of_kin_name, phone: client.next_of_kin_phone ?? "", relationship: "" }]
                  : []
              ).map((kin, i) => (
                <InfoRow
                  key={i}
                  label={kin.relationship || "Contact"}
                  value={[kin.name, kin.phone].filter(Boolean).join(" · ")}
                />
              ))}
              {!client.next_of_kins?.length && !client.next_of_kin_name && (
                <p className="text-xs text-muted-foreground">None on file.</p>
              )}
            </div>

            {/* Documents */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                ID document
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["front", "back"] as const).map((side) => (
                  <div key={side}>
                    {photos?.[side] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photos[side]!}
                        alt={`ID ${side}`}
                        className="aspect-[3/2] w-full rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground capitalize">
                        {side}: not uploaded
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(photos?.dlFront || photos?.dlBack) && (
                <>
                  <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Driving licence
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {([["dlFront", "front"], ["dlBack", "back"]] as const).map(([key, label]) => (
                      <div key={key}>
                        {photos?.[key] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photos[key]!}
                            alt={`DL ${label}`}
                            className="aspect-[3/2] w-full rounded-md border border-border object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground capitalize">
                            {label}: not uploaded
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {photos?.passport && (
                <>
                  <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Passport
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photos.passport}
                    alt="Passport"
                    className="aspect-[3/2] w-full rounded-md border border-border object-cover"
                  />
                </>
              )}
            </div>

            {client.notes && (
              <div>
                <p className="mb-1 text-muted-foreground">Notes</p>
                <p className="text-foreground">{client.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === "rentals" && (
          <div className="flex flex-col gap-2">
            {contracts === null ? (
              <div className="flex min-h-24 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex min-h-24 items-center justify-center text-xs text-muted-foreground">
                No rentals yet.
              </div>
            ) : (
              contracts.map((c) => (
                <div key={c.id} className="rounded-md border border-border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">
                      {c.cars
                        ? `${c.cars.reg_number} · ${[c.cars.make, c.cars.model].filter(Boolean).join(" ")}`
                        : "Vehicle"}
                    </p>
                    <Badge className={STATUS_STYLES[c.status] ?? "bg-muted text-foreground"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {shortDate(c.contract_start ?? c.created_at)} →{" "}
                    {shortDate(c.contract_expiration)} · {c.duration_days ?? "—"} days
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total {c.total_amount != null ? money(c.total_amount) : "—"} · Paid{" "}
                    {c.amount_paid != null ? money(c.amount_paid) : "—"}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Actions (staff or admin) */}
      <div className="flex gap-2 border-t border-border pt-3">
        <Button
          variant="outline"
          disabled={isPending}
          className={cn(
            "flex-1 border-border bg-transparent hover:bg-muted",
            client.is_blocked ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}
          onClick={toggleBlocked}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : client.is_blocked ? (
            <ShieldAlert className="size-4" />
          ) : (
            <Ban className="size-4" />
          )}
          {client.is_blocked ? "Unblock" : "Block"}
        </Button>
        <Button className="flex-1" onClick={() => onEdit(client)}>
          <Pencil className="size-4" />
          Edit
        </Button>
      </div>
    </SidePanel>
  );
}
