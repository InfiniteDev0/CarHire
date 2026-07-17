"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, UserCheck, UserX, UserMinus, Loader2, IdCard } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setStaffActive, removeStaff } from "../actions";

export interface StaffMember {
  user_id: string;
  role: "admin" | "staff";
  is_active: boolean;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface StaffPhotoUrls {
  front: string | null;
  back: string | null;
}

export function StaffTable({
  orgId,
  currentUserId,
  members,
  photoUrls,
}: {
  orgId: string;
  currentUserId: string;
  members: StaffMember[];
  photoUrls: Record<string, StaffPhotoUrls>;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [idTarget, setIdTarget] = useState<StaffMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [, startTransition] = useTransition();

  function toggleActive(m: StaffMember) {
    setPendingId(m.user_id);
    startTransition(async () => {
      try {
        await setStaffActive(orgId, m.user_id, !m.is_active);
        toast.success(m.is_active ? "Staff deactivated" : "Staff reactivated");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function doRemove() {
    const target = removeTarget;
    if (!target) return;
    setPendingId(target.user_id);
    startTransition(async () => {
      try {
        await removeStaff(orgId, target.user_id);
        toast.success(`${target.full_name ?? "Staff member"} removed from the workspace`);
        router.refresh();
        setRemoveTarget(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setPendingId(null);
      }
    });
  }

  const idUrls = idTarget ? photoUrls[idTarget.user_id] : undefined;

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="hidden sm:table-cell">Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">ID</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No members yet.
              </TableCell>
            </TableRow>
          ) : (
            members.map((m) => {
              const isSelf = m.user_id === currentUserId;
              const isAdmin = m.role === "admin";
              const busy = pendingId === m.user_id;
              const hasId = !!(photoUrls[m.user_id]?.front || photoUrls[m.user_id]?.back);
              return (
                <TableRow key={m.user_id} className={m.is_active ? "" : "opacity-60"}>
                  <TableCell className="font-medium">
                    {m.full_name || "—"}
                    {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.email || "—"}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {m.phone || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? "Admin" : "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {m.is_active ? (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {hasId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                        onClick={() => setIdTarget(m)}
                      >
                        <IdCard className="size-3.5" /> View
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Admins and your own row can't be deactivated here */}
                    {!isAdmin && !isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                              {busy ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <MoreVertical className="size-4" />
                              )}
                              <span className="sr-only">Staff actions</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleActive(m)}>
                            {m.is_active ? (
                              <>
                                <UserX className="size-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="size-4" />
                                Reactivate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => setRemoveTarget(m)}
                          >
                            <UserMinus className="size-4" />
                            Remove from workspace
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Remove confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removeTarget?.full_name ?? "this staff member"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They lose access to this workspace immediately. Rentals, payments and
              complaints they recorded keep their name on them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingId === removeTarget?.user_id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={pendingId === removeTarget?.user_id}
              onClick={(e) => {
                e.preventDefault();
                doRemove();
              }}
            >
              {pendingId === removeTarget?.user_id && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ID photos dialog */}
      <Dialog open={!!idTarget} onOpenChange={(o) => !o && setIdTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{idTarget?.full_name || "Staff"} — ID document</DialogTitle>
            <DialogDescription>Links expire after an hour for security.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {(["front", "back"] as const).map((side) => (
              <div key={side} className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground capitalize">{side}</p>
                {idUrls?.[side] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={idUrls[side]!}
                    alt={`ID ${side}`}
                    className="aspect-[3/2] w-full rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                    Not uploaded
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
