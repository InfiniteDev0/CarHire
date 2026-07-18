-- Presence + richer payment records.

-- Heartbeat timestamp — "Online" when fresh, "left Xh ago" when stale.
alter table org_members add column if not exists last_seen_at timestamptz;

-- Free-text payment evidence: M-Pesa confirmation code/message, card ref, etc.
alter table payments add column if not exists reference text;

-- Card joins the payment methods.
alter type payment_method add value if not exists 'CARD';

notify pgrst, 'reload schema';
