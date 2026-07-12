import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeGreeting({
  orgId,
  name,
  role,
}: {
  orgId: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-xl">
          {getGreeting()}, {name}
        </h1>
        <Badge variant="secondary">
          <BadgeCheck data-icon="inline-start" />
          {role}
        </Badge>
      </div>

      {/* quick CTAs */}
      <div className="flex items-center gap-2">
        <Button asChild className="h-7 rounded-sm">
          <Link href={`/workspace/${orgId}/rentals?new=1`}>Rent a car</Link>
        </Button>
        <Button asChild variant="outline" className="h-7 rounded-sm">
          <Link href={`/workspace/${orgId}/calendar`}>Open the calendar</Link>
        </Button>
      </div>
    </div>
  );
}
