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
  RENTAL: {
    icon: FileText,
    className:
      "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  PAYMENT: {
    icon: Banknote,
    className:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  CHECKOUT: {
    icon: LogOut,
    className: "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  },
  CHECKIN: {
    icon: LogIn,
    className:
      "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  },
  COMPLAINT: {
    icon: TriangleAlert,
    className:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  },
  CLIENT: {
    icon: UserRound,
    className:
      "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  },
  EXPENSE: {
    icon: ReceiptText,
    className: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  },
  VEHICLE: {
    icon: Car,
    className:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-300",
  },
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
      <div key={item.id} className="flex bg-accent p-2 rounded-md gap-3 py-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            meta.className,
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {item.title}
          </p>
          {item.detail && (
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
              {item.detail}
            </p>
          )}
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {fmtTime(item.at)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {member.full_name ?? "Staff member"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Activity trail — what they did, when.
          </p>
        </div>
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1">
        {items === null ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-zinc-600 dark:text-zinc-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
            <History className="size-8 text-zinc-400 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nothing recorded by this member yet.
            </p>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <p className="mb-1 mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Today
                </p>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
                  {today.map(renderItem)}
                </div>
              </>
            )}
            {earlier.length > 0 && (
              <>
                <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Earlier
                </p>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
                  {earlier.map(renderItem)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </SidePanel>
  );
}
