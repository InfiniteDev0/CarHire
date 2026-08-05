"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User, ExternalLink, CheckCircle2, RotateCcw, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCalendar } from "@cal/calendar/contexts/calendar-context";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { resolveReminder, deleteReminder } from "@/features/calendar/actions";

import type { IEvent } from "@cal/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const { orgId } = useCalendar();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const isReminder = event.kind === "REMINDER";
  const isRental = event.kind === "RENTAL";

  async function toggleResolve() {
    if (!event.reminderId || busy) return;
    setBusy(true);
    try {
      await resolveReminder(orgId, event.reminderId, !event.resolved);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event.reminderId || busy) return;
    setBusy(true);
    try {
      await deleteReminder(orgId, event.reminderId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <User className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">{isReminder ? "Reminder" : "Client"}</p>
              <p className="text-sm text-muted-foreground">{event.user.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">{isReminder ? "When" : "Start"}</p>
              <p className="text-sm text-muted-foreground">{format(startDate, "MMM d, yyyy h:mm a")}</p>
            </div>
          </div>

          {!isReminder && (
            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Return</p>
                <p className="text-sm text-muted-foreground">{format(endDate, "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Text className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">{isReminder ? "Note" : "Details"}</p>
              <p className="text-sm text-muted-foreground">{event.note || event.description || "—"}</p>
              {isReminder && event.resolved && (
                <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">Resolved</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isReminder ? (
            <div className="flex w-full items-center justify-between gap-2">
              <Button type="button" variant="outline" onClick={remove} disabled={busy} className="text-red-500">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                Delete
              </Button>
              <Button type="button" onClick={toggleResolve} disabled={busy}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : event.resolved ? (
                  <RotateCcw className="size-4" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {event.resolved ? "Reopen" : "Resolve"}
              </Button>
            </div>
          ) : isRental ? (
            <DialogClose asChild>
              <Button type="button" asChild>
                <a href={event.href ?? `/workspace/${orgId}/rentals`}>
                  <ExternalLink className="size-4" />
                  Open rental
                </a>
              </Button>
            </DialogClose>
          ) : (
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
