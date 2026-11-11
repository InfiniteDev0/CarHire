"use client";

import { useMemo, useState } from "react";
import { UserPlus, UserRound } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ActionTray,
  CardStatus,
  CardsEmpty,
  ListCard,
  ListToolbar,
  MiniPill,
  PageHeading,
  PersonCell,
  PRIMARY_ACTION,
  RecordCard,
  StatusPill,
  TableSearch,
  TrayDivider,
  ViewSwitch,
  type ListView,
} from "@/components/workspace/list";
import {
  ExportAction,
  RowCheck,
  SelectionBar,
  SortMenu,
  exportCsv,
  useSelection,
} from "@/components/workspace/list/tools";
import { cn } from "@/lib/utils";
import { getClientPhotoUrls, getClientContracts, type ClientDocUrls } from "../actions";
import type { ClientRow, ClientContract } from "../types";
import { ClientFormSheet } from "./client-form-sheet";
import { ClientDetailsSheet } from "./client-details-sheet";
import { money } from "@/lib/money";

type Sort = "NEW" | "NAME" | "DEBT";
const SORTS: { value: Sort; label: string }[] = [
  { value: "NEW", label: "Newest first" },
  { value: "NAME", label: "Name (A → Z)" },
  { value: "DEBT", label: "Owes most" },
];

const OK = "#10b981";
const BLOCKED = "#ef4444";

export function ClientsView({
  orgId,
  clients,
  staffNames,
  openAddOnLoad = false,
}: {
  orgId: string;
  clients: ClientRow[];
  staffNames: Record<string, string>;
  openAddOnLoad?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ListView>("table");
  const [sort, setSort] = useState<Sort>("NEW");
  const [formOpen, setFormOpen] = useState(openAddOnLoad);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<ClientRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photos, setPhotos] = useState<ClientDocUrls | null>(null);
  const [contracts, setContracts] = useState<ClientContract[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = !q
      ? clients
      : clients.filter((c) =>
          [c.full_name, c.national_id, c.phone, c.secondary_phone]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))
        );
    if (sort === "NAME") return [...rows].sort((a, b) => a.full_name.localeCompare(b.full_name));
    if (sort === "DEBT") return [...rows].sort((a, b) => Number(b.debt_owed) - Number(a.debt_owed));
    return rows;
  }, [clients, search, sort]);

  const selection = useSelection(filtered.map((c) => c.id));

  function exportSelected() {
    exportCsv(
      "clients.csv",
      ["Name", "National ID", "Phone", "Other phone", "Owes (USD)", "Status"],
      filtered
        .filter((c) => selection.has(c.id))
        .map((c) => [
          c.full_name,
          c.national_id,
          c.phone,
          c.secondary_phone,
          Number(c.debt_owed ?? 0),
          c.is_blocked ? "Blocked" : "OK",
        ]),
    );
  }

  function openDetails(c: ClientRow) {
    setDetailsTarget(c);
    setPhotos(null);
    setContracts(null);
    setDetailsOpen(true);
    // Lazy-load photos + history once the sheet is opening (event handler, not effect).
    getClientPhotoUrls(orgId, c.id)
      .then(setPhotos)
      .catch(() =>
        setPhotos({ front: null, back: null, dlFront: null, dlBack: null, passport: null })
      );
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

  const cards = (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-5 xl:grid-cols-3">
      {filtered.map((c) => (
        <RecordCard
          key={c.id}
          name={c.full_name}
          overline={c.national_id ? `ID ${c.national_id}` : "No ID on file"}
          status={
            <CardStatus color={c.is_blocked ? BLOCKED : OK}>{c.is_blocked ? "Blocked" : "OK"}</CardStatus>
          }
          details={c.phone || "No phone"}
          amount={c.debt_owed > 0 ? money(c.debt_owed) : undefined}
          amountClassName="text-red-600 dark:text-red-400"
          onClick={() => openDetails(c)}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeading
        title="Clients"
        description="Everyone who hires from you: their ID documents, what they owe and their rental history."
        count={filtered.length}
        noun="client"
      />

      <ListToolbar>
        <TableSearch value={search} onChange={setSearch} placeholder="Search name, ID or phone" />
        <SortMenu<Sort> options={SORTS} value={sort} onChange={setSort} defaultValue="NEW" />
        <ActionTray>
          <ViewSwitch view={view} onChange={setView} />
          <span className="hidden md:block">
            <TrayDivider />
          </span>
          <button type="button" className={PRIMARY_ACTION} onClick={openAdd}>
            <UserPlus className="size-4" />
            Add client
          </button>
        </ActionTray>
      </ListToolbar>

      {clients.length === 0 ? (
        <CardsEmpty
          kind="first"
          icon={<UserRound />}
          title="No clients yet"
          hint="Add the first person who hires a car from you."
          action={
            <button type="button" className={cn(PRIMARY_ACTION, "h-11 rounded-md px-6 text-[15px]")} onClick={openAdd}>
              Add a client
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <CardsEmpty kind="no-match" title="No clients match" hint="Try another word, or clear the search." />
      ) : (
        <>
          <SelectionBar count={selection.count} onClear={selection.clear}>
            <ExportAction onClick={exportSelected} />
          </SelectionBar>
          {/* Phones always get cards; desktop follows the view switch. */}
          <div className={cn(view === "table" && "md:hidden")}>{cards}</div>
          {view === "table" && (
            <ListCard className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <RowCheck checked={selection.allSelected} onChange={selection.toggleAll} label="Select all" />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>National ID</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Owes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      data-state={selection.has(c.id) ? "selected" : undefined}
                      onClick={() => openDetails(c)}
                    >
                      <TableCell className="w-10">
                        <RowCheck
                          checked={selection.has(c.id)}
                          onChange={() => selection.toggle(c.id)}
                          label={`Select ${c.full_name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <PersonCell name={c.full_name} sub={c.secondary_phone || undefined} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.national_id || "—"}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{c.phone || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.debt_owed > 0 ? (
                          <span className="inline-flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                            <MiniPill>Owed</MiniPill>
                            {money(c.debt_owed)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill color={c.is_blocked ? BLOCKED : OK}>
                          {c.is_blocked ? "Blocked" : "OK"}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ListCard>
          )}
        </>
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
