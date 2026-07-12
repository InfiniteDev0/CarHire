"use client";

import { Bell, Check, ArrowRight, XIcon, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface StatusPillProps {
  label: string;
  dotClassName: string;
}

function StatusPill({ label, dotClassName }: StatusPillProps) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal text-foreground">
      <span className={`size-1.5 shrink-0 rounded-full ${dotClassName}`} />
      {label}
    </Badge>
  );
}

interface NotificationItemData {
  id: string;
  actorName: string;
  actorAvatar?: string;
  action: string;
  target: string;
  timestamp: string;
  fromStatus?: { label: string; dotClassName: string };
  toStatus?: { label: string; dotClassName: string };
}

// Placeholder feed — swap for a real notifications table/query once the
// activity-log feature (staff actions, contract/complaint events) exists.
const MOCK_NOTIFICATIONS: NotificationItemData[] = [
  {
    id: "1",
    actorName: "Romina Yekani",
    action: "updated the task",
    target: "Design Sign-in/Login",
    timestamp: "5 hours ago",
    fromStatus: { label: "To-do", dotClassName: "bg-blue-500" },
    toStatus: { label: "In Progress", dotClassName: "bg-orange-500" },
  },
  {
    id: "2",
    actorName: "James Otieno",
    action: "checked in the vehicle",
    target: "KDB 245Y",
    timestamp: "Yesterday",
  },
  {
    id: "3",
    actorName: "Amina Hassan",
    action: "flagged a complaint on",
    target: "Contract #A102",
    timestamp: "2 days ago",
  },
];

function NotificationItem({ item }: { item: NotificationItemData }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={item.actorAvatar} alt={item.actorName} />
        <AvatarFallback>
          {item.actorName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-sm leading-snug text-foreground">
          <span className="font-medium">{item.actorName}</span>{" "}
          <span className="text-muted-foreground">{item.action}</span>{" "}
          <span className="font-medium">{item.target}</span>
        </p>
        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
        {item.fromStatus && item.toStatus && (
          <div className="flex items-center gap-2 pt-0.5">
            <StatusPill {...item.fromStatus} />
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <StatusPill {...item.toStatus} />
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationSheet() {
  const hasNotifications = MOCK_NOTIFICATIONS.length > 0;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button className="h-7 w-7" variant="outline">
            <Bell />
          </Button>
        }
      />
      <SheetContent showCloseButton={false} className="p-0 bg-background">
        <div className="flex items-center justify-between border-b px-1 py-2">
          <div className="flex items-center gap-1">
            <SheetClose
              render={<Button variant="ghost" size="icon-sm" />}
              aria-label="Close notifications"
            >
              <XIcon className="size-4" />
            </SheetClose>
            <SheetTitle>Notifications</SheetTitle>
          </div>
          {hasNotifications && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
              <CheckCheck className="size-3.5" />
              Mark as read
            </Button>
          )}
        </div>

        <div className="flex-1 divide-y overflow-y-auto">
          {hasNotifications ? (
            MOCK_NOTIFICATIONS.map((item) => <NotificationItem key={item.id} item={item} />)
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <Bell className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up — no notifications yet.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
