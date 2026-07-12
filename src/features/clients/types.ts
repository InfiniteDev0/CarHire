export interface ClientRow {
  id: string;
  full_name: string;
  national_id: string | null;
  kra_pin: string | null;
  phone: string | null;
  secondary_phone: string | null;
  email: string | null;
  address: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  notes: string | null;
  debt_owed: number;
  is_blocked: boolean;
  created_at: string;
}

export const CLIENT_COLUMNS =
  "id, full_name, national_id, kra_pin, phone, secondary_phone, email, address, next_of_kin_name, next_of_kin_phone, id_front_url, id_back_url, notes, debt_owed, is_blocked, created_at";

/** Contract slice shown in a client's rental history tab. */
export interface ClientContract {
  id: string;
  status: string;
  rate_per_day: number | null;
  duration_days: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  refuel_penalty: number | null;
  contract_start: string | null;
  contract_expiration: string | null;
  created_at: string;
  cars: { reg_number: string; make: string | null; model: string | null } | null;
}
