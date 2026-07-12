// DEMO DATA ONLY — the 5 cars currently "on rent" shown on the workspace home.
// Replace with a real Supabase query on `contracts` (status ACTIVE/OVERDUE)
// once that module exists. Shape is intentionally flat for easy display.

export type RentalStatus = "ACTIVE" | "DUE_SOON" | "OVERDUE";

export interface Rental {
  id: string;
  regNumber: string;
  make: string;
  model: string;
  clientName: string;
  clientPhone: string;
  county: string;
  ratePerDay: number; // KES / day
  startDate: string; // ISO date
  dueDate: string; // ISO date
  status: RentalStatus;
}

export const ONGOING_RENTALS: Rental[] = [
  {
    id: "r1",
    regNumber: "KDA 421J",
    make: "Toyota",
    model: "Axio",
    clientName: "John Kamau",
    clientPhone: "+254712345678",
    county: "Nairobi",
    ratePerDay: 3500,
    startDate: "2026-07-08",
    dueDate: "2026-07-14",
    status: "ACTIVE",
  },
  {
    id: "r2",
    regNumber: "KDG 118T",
    make: "Nissan",
    model: "X-Trail",
    clientName: "Mary Wanjiku",
    clientPhone: "+254723456789",
    county: "Kiambu",
    ratePerDay: 6500,
    startDate: "2026-07-05",
    dueDate: "2026-07-12",
    status: "DUE_SOON",
  },
  {
    id: "r3",
    regNumber: "KCA 905M",
    make: "Mazda",
    model: "Demio",
    clientName: "Ali Hassan",
    clientPhone: "+254734567890",
    county: "Mombasa",
    ratePerDay: 3000,
    startDate: "2026-07-01",
    dueDate: "2026-07-10",
    status: "OVERDUE",
  },
  {
    id: "r4",
    regNumber: "KDD 762P",
    make: "Toyota",
    model: "Prado",
    clientName: "Grace Otieno",
    clientPhone: "+254745678901",
    county: "Kisumu",
    ratePerDay: 12000,
    startDate: "2026-07-09",
    dueDate: "2026-07-16",
    status: "ACTIVE",
  },
  {
    id: "r5",
    regNumber: "KBZ 340X",
    make: "Subaru",
    model: "Forester",
    clientName: "Peter Njoroge",
    clientPhone: "+254756789012",
    county: "Nakuru",
    ratePerDay: 7000,
    startDate: "2026-07-07",
    dueDate: "2026-07-13",
    status: "ACTIVE",
  },
];
