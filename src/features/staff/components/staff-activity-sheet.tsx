"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  FileText,
  Banknote,
  LogOut,
  LogIn,
  TriangleAlert,
  UserRound,
  ReceiptText,
  Car,
  History,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/workspace/side-panel";
import { getStaffActivity, type StaffActivityItem } from "../actions";
import type { StaffMember } from "./staff-table";

const KIND_META: Record<
  StaffActivityItem["kind"],
  { icon: typeof FileText; className: string }
> = {
  RENTAL: { icon: FileText, className: "bg-blue-500/10 text-blue-400" },
  PAYMENT: { icon: Banknote, className: "bg-emerald-500/10 text-emerald-400" },
  CHECKOUT: { icon: LogOut, className: "bg-sky-500/10 text-sky-400" },
  CHECKIN: { icon: LogIn, className: "bg-green-500/10 text-green-400" },
  COMPLAINT: { icon: TriangleAlert, className: "bg-amber-500/10 text-amber-400" },
  CLIENT: { icon: UserRound, className: "bg-purple-500/10 text-purple-400" },
  EXPENSE: { icon: ReceiptText, className: "bg-red-500/10 text-red-400" },
  VEHICLE: { icon: Car, className: "bg-zinc-500/10 text-zinc-300" },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function StaffActivitySheet({
  orgId,
  member,
  open,
  onOpenChange,
}: {
  orgId: string;
  member: StaffMember | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [items, setItems] = useState<StaffActivityItem[] | null>(null);

  useEffect(() => {
    if (!open || !member) return;
    let cancelled = false;
    setItems(null);
    getStaffActivity(orgId, member.user_id)
      .then((res) => !cancelled && setItems(res))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [open, orgId, member]);

  if (!member) return null;

  const today = (items ?? []).filter((i) => isToday(i.at));
  const earlier = (items ?? []).filter((i) => !isToday(i.at));

  const renderItem = (item: StaffActivityItem) => {
    const meta = KIND_META[item.kind];
    const Icon = meta.icon;
    return (
      <div key={item.id} className="flex gap-3 py-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            meta.className
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">{item.title}</p>
          {item.detail && <p className="truncate text-xs text-zinc-500">{item.detail}</p>}
          <p className="text-xs text-zinc-600">{fmtTime(item.at)}</p>
        </div>
      </div>
    );
  };

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{member.full_name ?? "Staff member"}</h2>
          <p className="text-xs text-zinc-500">Activity trail — what they did, when.</p>
        </div>
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1">
        {items === null ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-zinc-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <History className="size-8 text-zinc-700" />
            <p className="text-sm text-zinc-500">Nothing recorded by this member yet.</p>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <p className="mb-1 mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Today
                </p>
                <div className="divide-y divide-zinc-800/70">{today.map(renderItem)}</div>
              </>
            )}
            {earlier.length > 0 && (
              <>
                <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Earlier
                </p>
                <div className="divide-y divide-zinc-800/70">{earlier.map(renderItem)}</div>
              </>
            )}
          </>
        )}
      </div>
    </SidePanel>
  );
}
