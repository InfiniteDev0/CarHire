"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Car, Bell, Loader2, ChevronLeft, ChevronDownIcon } from "lucide-react";

import { useDisclosure } from "@cal/hooks/use-disclosure";
import { useCalendar } from "@cal/calendar/contexts/calendar-context";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { createReminder } from "@/features/calendar/actions";

const REMINDER_COLORS = [
  { value: "yellow", label: "Yellow", dot: "bg-yellow-500" },
  { value: "blue", label: "Blue", dot: "bg-blue-500" },
  { value: "green", label: "Green", dot: "bg-green-500" },
  { value: "red", label: "Red", dot: "bg-red-500" },
  { value: "purple", label: "Purple", dot: "bg-purple-500" },
  { value: "orange", label: "Orange", dot: "bg-orange-500" },
  { value: "gray", label: "Gray", dot: "bg-neutral-500" },
] as const;

interface IProps {
  children: React.ReactNode;
  startDate?: Date;
  // Accepted for API-compatibility with the calendar's day/time cells; unused.
  startTime?: { hour: number; minute: number };
}

export function AddEventDialog({ children, startDate }: IProps) {
  const { orgId } = useCalendar();
  const router = useRouter();
  const { isOpen, onClose, onToggle } = useDisclosure();

  const [mode, setMode] = useState<"choose" | "reminder">("choose");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date | undefined>(startDate);
  const [dateOpen, setDateOpen] = useState(false);
  const [time, setTime] = useState("09:00");
  const [color, setColor] = useState<string>("yellow");
  const [saving, setSaving] = useState(false);

  function reset() {
    setMode("choose");
    setTitle("");
    setNote("");
    setDate(startDate);
    setTime("09:00");
    setColor("yellow");
  }

  function goToNewRental() {
    onClose();
    router.push(`/workspace/${orgId}/rentals?new=1`);
  }

  async function saveReminder() {
    if (saving) return;
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      const [h, m] = time.split(":").map(Number);
      const remindAt = new Date(date);
      remindAt.setHours(h || 9, m || 0, 0, 0);
      await createReminder(orgId, {
        title: title.trim(),
        note: note.trim() || undefined,
        remindAt: remindAt.toISOString(),
        color,
      });
      onClose();
      reset();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        onToggle();
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        {mode === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add to the calendar</DialogTitle>
              <DialogDescription>Start a rental, or set a reminder with a note.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-1">
              <button
                type="button"
                onClick={goToNewRental}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                  <Car className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">New rental</span>
                  <span className="block text-xs text-muted-foreground">Opens the new-rental flow</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode("reminder")}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-500">
                  <Bell className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium">Set a reminder</span>
                  <span className="block text-xs text-muted-foreground">A note pinned to a date &amp; time</span>
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button type="button" onClick={() => setMode("choose")} aria-label="Back">
                  <ChevronLeft className="size-4" />
                </button>
                New reminder
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-1">
              <div className="grid gap-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Call client about return" />
              </div>

              <div className="flex items-end gap-3">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="reminder-date">Date</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button id="reminder-date" variant="outline" className="w-full justify-between font-normal">
                        {date ? format(date, "PPP") : "Select date"}
                        <ChevronDownIcon className="size-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        defaultMonth={date}
                        onSelect={(d) => {
                          setDate(d);
                          setDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid w-32 gap-1.5">
                  <Label htmlFor="reminder-time">Time</Label>
                  <Input
                    id="reminder-time"
                    type="time"
                    step="1"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Colour</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className={`size-3.5 rounded-full ${c.dot}`} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label>Note</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add any details…" rows={4} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMode("choose")}>
                Back
              </Button>
              <Button type="button" onClick={saveReminder} disabled={saving || !title.trim() || !date}>
                {saving && <Loader2 className="mr-1 size-4 animate-spin" />}
                Save reminder
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
