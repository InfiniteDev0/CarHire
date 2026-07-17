"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus, UserRound, ChevronRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { getClientPhotoUrls, getClientContracts } from "../actions";
import type { ClientRow, ClientContract } from "../types";
import { ClientFormSheet } from "./client-form-sheet";
import { ClientDetailsSheet } from "./client-details-sheet";

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;

export function ClientsView({
  orgId,
  clients,
  staffNames,
}: {
  orgId: string;
  clients: ClientRow[];
  staffNames: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<ClientRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photos, setPhotos] = useState<{ front: string | null; back: string | null } | null>(null);
  const [contracts, setContracts] = useState<ClientContract[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.full_name, c.national_id, c.phone, c.secondary_phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [clients, search]);

  function openDetails(c: ClientRow) {
    setDetailsTarget(c);
    setPhotos(null);
    setContracts(null);
    setDetailsOpen(true);
    // Lazy-load photos + history once the sheet is opening (event handler, not effect).
    getClientPhotoUrls(orgId, c.id).then(setPhotos).catch(() => setPhotos({ front: null, back: null }));
    getClientContracts(orgId, c.id).then(setContracts).catch(() => setContracts([]));
  }
  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(c: ClientRow) {
    setDetailsOpen(false);
    setEditing(c);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID or phone…"
            className="h-8 pl-8"
          />
        </div>
        <div className="ml-auto">
          <Button className="h-8 gap-1.5 rounded-sm" onClick={openAdd}>
            <UserPlus className="size-4" />
            Add client
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <UserRound className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {clients.length === 0
              ? "No clients yet. Add your first hirer."
              : "No clients match this search."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">National ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Debt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => openDetails(c)}
                >
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {c.national_id || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell>
                    {c.debt_owed > 0 ? (
                      <span className="font-medium text-red-500">{kes(c.debt_owed)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.is_blocked ? (
                      <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                        Blocked
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                        OK
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheets */}
      <ClientFormSheet orgId={orgId} editing={editing} open={formOpen} onOpenChange={setFormOpen} />
      <ClientDetailsSheet
        orgId={orgId}
        client={detailsTarget}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        photos={photos}
        contracts={contracts}
        onEdit={openEdit}
        staffNames={staffNames}
      />
    </div>
  );
}
