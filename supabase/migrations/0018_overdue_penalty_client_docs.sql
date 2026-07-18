-- Overdue alerting, configurable refuel penalty, extra client documents.

-- Stamped when the org has been push-notified about this overdue contract,
-- so the alert fires once instead of on every page load.
alter table contracts add column if not exists overdue_notified_at timestamptz;

-- Admin-tunable refuel penalty per missing fuel-gauge step (KES).
alter table organizations
  add column if not exists refuel_penalty_per_level numeric(12,2) not null default 1500;

-- Optional client documents: Smart DL (front/back) and passport.
alter table clients add column if not exists dl_front_url  text;
alter table clients add column if not exists dl_back_url   text;
alter table clients add column if not exists passport_url  text;

notify pgrst, 'reload schema';
