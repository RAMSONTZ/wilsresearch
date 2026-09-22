-- Run after schema.sql, workflow-migration.sql, and documents-migration.sql.
-- Replaces the payment RLS policies with explicit authenticated ownership checks.

drop policy if exists "clients read own payments" on public.payments;
drop policy if exists "clients submit own payments" on public.payments;
drop policy if exists "admins update payments" on public.payments;

create policy "clients read own payments"
on public.payments for select to authenticated
using (
  exists (
    select 1
    from public.bookings
    where bookings.id = payments.booking_id
      and bookings.client_id = (select auth.uid())
  )
  or public.is_admin()
);

create policy "clients submit own payments"
on public.payments for insert to authenticated
with check (
  booking_id is not null
  and amount > 0
  and status = 'Submitted'
  and exists (
    select 1
    from public.bookings
    where bookings.id = payments.booking_id
      and bookings.client_id = (select auth.uid())
  )
);

create policy "admins update payments"
on public.payments for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists payments_booking_id_idx
on public.payments (booking_id);
