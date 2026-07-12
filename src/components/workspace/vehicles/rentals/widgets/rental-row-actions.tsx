"use client";

import { useRouter } from "next/navigation";
import { MoreVertical, Eye, LogIn, CalendarClock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { Rental } from "@/lib/constants/rentals";

/**
 * Row actions for the home Ongoing Rentals table. With an orgId the items
 * navigate to the Rentals page (where checkout/checkin/extend live); without
 * one they stay demo toasts.
 */
export function RentalRowActions({
  rental,
  orgId,
}: {
  rental: Rental;
  orgId?: string;
}) {
  const router = useRouter();

  function go() {
    if (orgId) router.push(`/workspace/${orgId}/rentals`);
    else toast.info(`Demo row · ${rental.regNumber}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <MoreVertical />
            <span className="sr-only">Open actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={go}>
          <Eye />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={go}>
          <LogIn />
          Check in vehicle
        </DropdownMenuItem>
        <DropdownMenuItem onClick={go}>
          <CalendarClock />
          Extend rental
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
