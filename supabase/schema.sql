create extension if not exists pgcrypto;

create type public.user_role as enum ('client', 'admin');
create type public.booking_status as enum ('Pending Review', 'Received', 'In Progress', 'Correction', 'Completed', 'Awaiting Payment', 'Paid', 'Delivered');
create type public.payment_status as enum ('Submitted', 'Received', 'Rejected');
create type public.document_type as enum ('Client Files', 'Working Documents', 'Draft', 'Final Work');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  username text unique,
  phone text,
  account_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  phone text not null,
  email text,
  university text,
  registration text,
  course text,
  title text not null,
  design text,
  description text not null,
  notes text,
  status public.booking_status not null default 'Pending Review',
  expected_date date,
  deadline date,
  agreed_amount numeric(12,2) not null default 0 check (agreed_amount >= 0),
  received_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  sender_type text,
  sender_name text,
  sender_phone text,
  account_name text,
  reference text,
  receipt_path text,
  payment_date date not null default current_date,
  status public.payment_status not null default 'Submitted',
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  name text not null,
  document_type public.document_type not null,
  storage_path text not null,
  is_final boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.booking_activity (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references public.bookings(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, phone)
  values (new.id, new.raw_user_meta_data ->> 'username', new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.services (slug, name, description, features) values
('assignments', 'Assignments', 'Academic assignments, reports and structured academic documents.', '["Academic reports", "Structured writing", "Formatting", "References"]'),
('research-proposals', 'Research Proposals & Reports', 'Proposal development, research reports, methodology and academic documentation.', '["Proposal writing", "Methodology support", "Literature review", "Complete reports"]'),
('data-analysis', 'Data Collection & Analysis', 'Data cleaning, coding, analysis, interpretation and presentation.', '["Data cleaning", "SPSS, STATA, Excel", "Tables and charts", "Interpretation"]'),
('business-plans', 'Business Plans', 'Professional business plans, market research and financial planning.', '["Market research", "Feasibility studies", "Financial projections", "Business pitch decks"]'),
('presentations', 'Presentations', 'Academic presentations, research findings and professional PowerPoint decks.', '["PowerPoint decks", "Defense slides", "Findings summary", "Visual polish"]'),
('cv-revamping', 'CV Revamping', 'Professional CV restructuring and presentation.', '["CV writing", "Cover letters", "LinkedIn profile support", "Academic CVs"]'),
('spss-stata-excel', 'SPSS / STATA / Excel', 'Statistical analysis, data cleaning, tables, charts and reporting.', '["Descriptive statistics", "Regression", "Cross-tabs", "Charts"]'),
('consultation', 'Research Consultation', 'Research design, topic development, methodology and general research guidance.', '["Topic selection", "Study design", "Analysis plan", "General guidance"]')
on conflict (slug) do update set name = excluded.name, description = excluded.description, features = excluded.features;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.prevent_unpaid_completion()
returns trigger
language plpgsql
as $$
declare
  confirmed_total numeric(12,2);
begin
  if new.status = 'Completed' then
    select coalesce(sum(amount), 0) into confirmed_total
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

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.booking_messages enable row level security;
alter table public.booking_activity enable row level security;
alter table public.feedback enable row level security;

create policy "public can read active services" on public.services for select using (active = true);
create policy "users read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "clients read own bookings" on public.bookings for select using (client_id = auth.uid() or public.is_admin());
create policy "clients create own bookings" on public.bookings for insert with check (client_id = auth.uid());
create policy "admins update bookings" on public.bookings for update using (public.is_admin()) with check (public.is_admin());
create policy "clients read own payments" on public.payments for select using (exists (select 1 from public.bookings where bookings.id = payments.booking_id and bookings.client_id = auth.uid()) or public.is_admin());
create policy "clients submit own payments" on public.payments for insert with check (exists (select 1 from public.bookings where bookings.id = booking_id and bookings.client_id = auth.uid()));
create policy "admins update payments" on public.payments for update using (public.is_admin()) with check (public.is_admin());
create policy "clients read own documents" on public.documents for select using (exists (select 1 from public.bookings where bookings.id = documents.booking_id and bookings.client_id = auth.uid()) or public.is_admin());
create policy "admins manage documents" on public.documents for all using (public.is_admin()) with check (public.is_admin());
create policy "clients read own messages" on public.booking_messages for select using (exists (select 1 from public.bookings where bookings.id = booking_messages.booking_id and bookings.client_id = auth.uid()) or public.is_admin());
create policy "admins manage messages" on public.booking_messages for all using (public.is_admin()) with check (public.is_admin());
create policy "clients read own activity" on public.booking_activity for select using (exists (select 1 from public.bookings where bookings.id = booking_activity.booking_id and bookings.client_id = auth.uid()) or public.is_admin());
create policy "admins manage activity" on public.booking_activity for all using (public.is_admin()) with check (public.is_admin());
create policy "clients manage own feedback" on public.feedback for all using (client_id = auth.uid() or public.is_admin()) with check (client_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public) values ('client-files', 'client-files', false), ('payment-receipts', 'payment-receipts', false), ('deliverables', 'deliverables', false) on conflict (id) do nothing;
create policy "authenticated users upload client files" on storage.objects for insert to authenticated with check (bucket_id = 'client-files' and owner_id = auth.uid()::text);
create policy "users read their own client files" on storage.objects for select to authenticated using (bucket_id = 'client-files' and (owner_id = auth.uid()::text or public.is_admin()));
create policy "authenticated users upload receipts" on storage.objects for insert to authenticated with check (bucket_id = 'payment-receipts' and owner_id = auth.uid()::text);
create policy "users read receipts" on storage.objects for select to authenticated using (bucket_id = 'payment-receipts' and (owner_id = auth.uid()::text or public.is_admin()));
create policy "admins manage deliverables" on storage.objects for all to authenticated using (bucket_id = 'deliverables' and public.is_admin()) with check (bucket_id = 'deliverables' and public.is_admin());
