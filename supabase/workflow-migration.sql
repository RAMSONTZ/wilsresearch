-- Run this after supabase/schema.sql.
-- It is safe to run again while developing.

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
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_paid_before_completion on public.bookings;
create trigger enforce_paid_before_completion
before update of status, agreed_amount on public.bookings
for each row execute procedure public.prevent_unpaid_completion();

-- Replace the policies from the initial script with type-safe, restricted versions.
drop policy if exists "authenticated users upload client files" on storage.objects;
drop policy if exists "users read their own client files" on storage.objects;
drop policy if exists "authenticated users upload receipts" on storage.objects;
drop policy if exists "users read receipts" on storage.objects;
drop policy if exists "admins manage deliverables" on storage.objects;
drop policy if exists "clients read their own deliverables" on storage.objects;

create policy "authenticated users upload client files"
on storage.objects for insert to authenticated
with check (bucket_id = 'client-files' and owner_id = auth.uid()::text);

create policy "users read their own client files"
on storage.objects for select to authenticated
using (bucket_id = 'client-files' and (owner_id = auth.uid()::text or public.is_admin()));

create policy "authenticated users upload receipts"
on storage.objects for insert to authenticated
with check (bucket_id = 'payment-receipts' and owner_id = auth.uid()::text);

create policy "users read receipts"
on storage.objects for select to authenticated
using (bucket_id = 'payment-receipts' and (owner_id = auth.uid()::text or public.is_admin()));

create policy "admins manage deliverables"
on storage.objects for all to authenticated
using (bucket_id = 'deliverables' and public.is_admin())
with check (bucket_id = 'deliverables' and public.is_admin());

create policy "clients read their own deliverables"
on storage.objects for select to authenticated
using (
  bucket_id = 'deliverables'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.bookings
      where bookings.client_id = auth.uid()
        and storage.objects.name like bookings.id::text || '/%'
    )
  )
);
