-- Run after schema.sql, workflow-migration.sql, documents-migration.sql,
-- and payments-migration.sql.
-- Adds admin deletion and automatic cleanup 10 days after completion.

drop policy if exists "admins delete bookings" on public.bookings;
create policy "admins delete bookings"
on public.bookings for delete to authenticated
using (public.is_admin());

create or replace function public.prevent_unpaid_completion()
returns trigger
language plpgsql
as $$
declare
  confirmed_total numeric(12,2);
begin
  if new.status = 'Completed' then
    select coalesce(sum(amount), 0)
    into confirmed_total
    from public.payments
    where booking_id = new.id and status = 'Received';

    if new.agreed_amount <= 0 or confirmed_total < new.agreed_amount then
      raise exception 'Booking cannot be marked Completed until confirmed payments cover the agreed amount';
    end if;

    new.completed_at = coalesce(new.completed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_paid_before_completion on public.bookings;
create trigger enforce_paid_before_completion
before update of status, agreed_amount on public.bookings
for each row execute procedure public.prevent_unpaid_completion();

update public.bookings
set completed_at = coalesce(completed_at, created_at)
where status in ('Completed', 'Paid', 'Delivered')
  and completed_at is null;

create or replace function public.delete_completed_projects()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  with removed as (
    delete from public.bookings
    where status in ('Completed', 'Paid', 'Delivered')
      and completed_at is not null
      and completed_at <= now() - interval '10 days'
    returning id
  )
  select count(*) into deleted_count from removed;
  return deleted_count;
end;
$$;

-- Supabase projects support pg_cron. This runs daily at 02:15 UTC.
create extension if not exists pg_cron with schema pg_catalog;
select cron.unschedule('delete-completed-projects-after-10-days')
where exists (
  select 1 from cron.job where jobname = 'delete-completed-projects-after-10-days'
);
select cron.schedule(
  'delete-completed-projects-after-10-days',
  '15 2 * * *',
  $$select public.delete_completed_projects();$$
);
