import { ArrowUpRight, ArrowDownLeft, History } from "lucide-react";

export interface ActivityEvent {
  id: string;
  kind: "CHECKOUT" | "CHECKIN";
  at: string; // ISO
  regNumber: string;
  clientName: string;
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export function RecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl dark:bg-black bg-white p-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <History className="size-4" />
        Recent activity
      </div>

      {events.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Checkouts and returns will show up here.
        </p>
      ) : (
        <ul className="flex flex-col">
          {events.map((e) => (
            <li
              key={`${e.kind}-${e.id}`}
              className="flex items-center gap-2.5 border-b py-2 text-sm last:border-b-0"
            >
              {e.kind === "CHECKOUT" ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <ArrowUpRight className="size-3.5" />
                </span>
              ) : (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  <ArrowDownLeft className="size-3.5" />
                </span>
              )}
              <span className="min-w-0 truncate">
                <span className="font-medium">{e.regNumber}</span>{" "}
                <span className="text-muted-foreground">
                  {e.kind === "CHECKOUT" ? "checked out to" : "returned by"}
                </span>{" "}
                {e.clientName}
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {timeAgo(e.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
