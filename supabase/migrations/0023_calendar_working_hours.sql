-- 0023_calendar_working_hours.sql
-- Per-day working hours for the calendar, set by the admin in Settings.
-- Shape: { "0": {from,to}, ... "6": {from,to} } (0 = Sunday). from==to==0 = closed.
-- Idempotent.

alter table organizations add column if not exists cal_working_hours jsonb
  not null default '{"0":{"from":0,"to":0},"1":{"from":9,"to":17},"2":{"from":9,"to":17},"3":{"from":9,"to":17},"4":{"from":9,"to":17},"5":{"from":9,"to":17},"6":{"from":9,"to":13}}'::jsonb;

notify pgrst, 'reload schema';
