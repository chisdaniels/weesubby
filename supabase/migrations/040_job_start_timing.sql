-- Migration 040: when a posted job can start
-- Paste into Supabase Dashboard → SQL Editor → New query → Run.
--
-- start_timing: 'ready' (ready to start now), 'planning' (still planning) or
-- 'date' (start on start_date, which is set only then). Older jobs leave both empty.
-- Idempotent; safe to re-run.

alter table jobs add column if not exists start_timing text;
alter table jobs add column if not exists start_date date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'jobs_start_timing_check') then
    alter table jobs add constraint jobs_start_timing_check
      check (start_timing is null or start_timing in ('ready', 'planning', 'date'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'jobs_start_date_check') then
    alter table jobs add constraint jobs_start_date_check
      check (
        (start_timing is null and start_date is null)
        or (start_timing = 'date' and start_date is not null)
        or (start_timing in ('ready', 'planning') and start_date is null)
      );
  end if;
end $$;
