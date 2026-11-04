-- Migration 035: contractors pay, customers don't.
--
-- Customers (homeowners, businesses) stay free. Contractors join and list for
-- free; accepting a job needs the Pro plan. Homeowner contact details are
-- already limited to the accepting pro (migration 029), so gating acceptance
-- also gates contact details.
--
-- contractors.plan is set by the stripe-webhook Edge Function (service role)
-- or by an admin. Contractors can't change it themselves.
-- Idempotent without removing anything, so it can be re-run safely.

alter table contractors add column if not exists plan text not null default 'free';
alter table contractors add column if not exists plan_started_at timestamptz;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contractors_plan_check') then
    alter table contractors add constraint contractors_plan_check check (plan in ('free', 'pro'));
  end if;
end $$;

-- Stripe IDs, kept off the publicly readable contractors table.
-- RLS on with no policies: only the service role (Edge Functions) can touch it.
create table if not exists contractor_billing (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text unique not null,
  stripe_subscription_id text unique,
  subscription_status    text,
  updated_at             timestamptz not null default now()
);
alter table contractor_billing enable row level security;
revoke all on contractor_billing from anon, authenticated;
grant all on contractor_billing to service_role;

-- Same as before, plus: non-admins can't set or change their own plan.
create or replace function public.enforce_contractor_admin_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_catalog'
as $function$
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') or private.is_admin(auth.uid()) then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verified    := false;
    new.verified_at := null;
    new.verified_by := null;
    new.plan            := 'free';
    new.plan_started_at := null;
  else
    new.plan            := old.plan;
    new.plan_started_at := old.plan_started_at;
  end if;
  return new;
end;
$function$;

-- Same as before, plus: accepting an open job needs the Pro plan.
create or replace function public.enforce_job_update_rules()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private', 'pg_catalog'
as $function$
declare
  uid uuid := auth.uid();
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') or private.is_admin(uid) then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.posted_by is distinct from old.posted_by
     or new.created_at is distinct from old.created_at
     or new.group_id is distinct from old.group_id then
    raise exception 'That job detail can''t be changed.';
  end if;
  if old.accepted_by is null and new.accepted_by is not null then
    if new.accepted_by is distinct from uid or old.deleted_at is not null or not exists (
      select 1 from contractors c
        join contractor_credentials cc on cc.contractor_id = c.id
       where c.user_id = uid
         and c.verified
         and c.deactivated_at is null
         and (cc.business_license_path is not null or cc.license_path is not null)
         and cc.insurance_path is not null
         and (old.trade = any(c.trades) or c.trade = old.trade)
    ) then
      raise exception 'You can only accept an open job that matches your approved services.';
    end if;
    if not exists (select 1 from contractors c where c.user_id = uid and c.plan = 'pro') then
      raise exception 'Accepting jobs needs a WeeSubby Pro plan.';
    end if;
  end if;
  if uid is not null and uid = old.posted_by then
    if old.accepted_by is not null and new.accepted_by is distinct from old.accepted_by and new.accepted_by is not null then
      raise exception 'You can release the pro on your job, but not assign a different one.';
    end if;
    if new.deleted_by is distinct from old.deleted_by and new.deleted_by is not null and new.deleted_by <> uid then
      raise exception 'That job detail can''t be changed.';
    end if;
    return new;
  end if;
  if old.accepted_by is null and new.accepted_by = uid
     and (to_jsonb(new) - 'accepted_by' - 'accepted_at' - 'status')
       = (to_jsonb(old) - 'accepted_by' - 'accepted_at' - 'status') then
    return new;
  end if;
  raise exception 'Only the person who posted this job can change it.';
end;
$function$;
