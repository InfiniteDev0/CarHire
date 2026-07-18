import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { Rental } from "@/lib/constants/rentals";
import { RentalStatusBadge } from "./widgets/rental-status-badge";
import { RentalRowActions } from "./widgets/rental-row-actions";

const kes = (n: number) => `KES ${n.toLocaleString()}`;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

export function RentalsDataTable({
  data,
  orgId,
}: {
  data: Rental[];
  orgId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="dark:bg-black bg-white">
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="hidden md:table-cell">County</TableHead>
            <TableHead>Rate / day</TableHead>
            <TableHead className="hidden sm:table-cell">Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No rentals match this filter.
              </TableCell>
            </TableRow>
          ) : (
            data.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.regNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.make} {r.model}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{r.clientName}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.clientPhone}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {r.county}
                </TableCell>
                <TableCell className="tabular-nums">
                  {kes(r.ratePerDay)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                  {shortDate(r.startDate)} → {shortDate(r.dueDate)}
                </TableCell>
                <TableCell>
                  <RentalStatusBadge status={r.status} />
                </TableCell>
                <TableCell>
                  <RentalRowActions rental={r} orgId={orgId} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
