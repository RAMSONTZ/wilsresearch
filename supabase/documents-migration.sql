-- Run this after schema.sql and workflow-migration.sql.
-- Allows clients to register their own uploaded booking files in public.documents.

create index if not exists bookings_client_id_idx on public.bookings (client_id);
create index if not exists documents_booking_id_idx on public.documents (booking_id);
create index if not exists payments_booking_id_status_idx on public.payments (booking_id, status);

drop policy if exists "clients upload own document metadata" on public.documents;
create policy "clients upload own document metadata"
on public.documents for insert
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.bookings
    where bookings.id = documents.booking_id
      and bookings.client_id = auth.uid()
  )
);

drop policy if exists "clients read own documents" on public.documents;
drop policy if exists "clients read unlocked own documents" on public.documents;
drop policy if exists "clients read own document metadata" on public.documents;
create policy "clients read own document metadata"
on public.documents for select
using (
  exists (
    select 1 from public.bookings
    where bookings.id = documents.booking_id
      and bookings.client_id = auth.uid()
  )
);

drop policy if exists "clients read their own deliverables" on storage.objects;
drop policy if exists "clients read unlocked own deliverables" on storage.objects;
create policy "clients read unlocked own deliverables"
on storage.objects for select to authenticated
using (
  bucket_id = 'deliverables'
  and exists (
    select 1
    from public.documents
    join public.bookings on bookings.id = documents.booking_id
    where documents.storage_path = storage.objects.name
      and bookings.client_id = auth.uid()
      and (
        not documents.is_final
        or (
          bookings.status in ('Completed', 'Paid', 'Delivered')
          and coalesce((select sum(payments.amount) from public.payments where payments.booking_id = bookings.id and payments.status = 'Received'), 0) >= bookings.agreed_amount
        )
      )
  )
);
