-- Run after documents-migration.sql.
-- Clients can see uploaded document names and lock status.
-- Storage downloads remain protected until payment and completion rules pass.

drop policy if exists "clients read own documents" on public.documents;
drop policy if exists "clients read unlocked own documents" on public.documents;
drop policy if exists "clients read own document metadata" on public.documents;

create policy "clients read own document metadata"
on public.documents for select
using (
  exists (
    select 1
    from public.bookings
    where bookings.id = documents.booking_id
      and bookings.client_id = (select auth.uid())
  )
);