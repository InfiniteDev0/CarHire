-- 0022_calendar_settings.sql
-- Per-org calendar display settings (badge style, visible + working hours),
-- edited by admins in Settings → Operations and applied to the calendar.
-- Hours are 0–23. Idempotent.

alter table organizations add column if not exists cal_badge_variant text not null default 'colored';
alter table organizations add column if not exists cal_visible_start int not null default 7;
alter table organizations add column if not exists cal_visible_end   int not null default 18;
alter table organizations add column if not exists cal_work_start    int not null default 8;
alter table organizations add column if not exists cal_work_end      int not null default 17;

notify pgrst, 'reload schema';
