-- Run once in Neon SQL editor. Do not expose DATABASE_URL in browser-side code.
create table if not exists wils_admins(
 id bigserial primary key,email text not null unique,display_name text not null default 'WILS Administrator',
 password_salt text not null,password_hash text not null,created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists wils_admin_sessions(
 id bigserial primary key,admin_id bigint not null references wils_admins(id) on delete cascade,
 token_hash text not null unique,expires_at timestamptz not null,created_at timestamptz not null default now()
);
create index if not exists idx_wils_sessions_expiry on wils_admin_sessions(expires_at);
create table if not exists wils_bookings(
 id bigserial primary key, reference text unique not null, tracking_hash text unique not null,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 full_name text not null,phone text not null,email text not null,service text not null,
 project_title text,project_level text,start_date date,requested_deadline date,notes text,
 priority text not null check(priority in ('Standard','VIP')),
 status text not null default 'awaiting_payment' check(status in ('awaiting_payment','payment_submitted','confirmed','rejected','in_progress','completed')),
 amount_total integer not null default 100000,deposit_due integer not null default 20000,
 priority_fee integer not null default 0,balance_due integer not null default 80000,
 payment_method text,payment_reference text,payment_sender text,payer_phone text,
 payment_claimed_at timestamptz,approved_at timestamptz,project_group integer,group_place integer,
 ip_hash text,
 constraint group_both check((project_group is null and group_place is null) or (project_group>=1 and group_place between 1 and 7))
);
create index if not exists idx_wils_bookings_status_created on wils_bookings(status,created_at desc);
create index if not exists idx_wils_bookings_iphour on wils_bookings(ip_hash,created_at desc);
create unique index if not exists unique_payment_claim on wils_bookings(payment_method,lower(payment_reference)) where payment_reference is not null and status <> 'rejected';
create table if not exists wils_queue(singleton boolean primary key default true check(singleton),last_position integer not null default 0);
insert into wils_queue(singleton,last_position) values(true,0) on conflict do nothing;
create table if not exists wils_admin_audit(id bigserial primary key,admin_id bigint references wils_admins(id),booking_id bigint references wils_bookings(id),action text not null,details jsonb,created_at timestamptz not null default now());
create table if not exists wils_notifications(
 id bigserial primary key,booking_id bigint not null references wils_bookings(id),kind text not null,
 state text not null default 'queued' check(state in ('queued','sent','failed','skipped')),
 attempts integer not null default 0,last_error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists unique_booking_notice on wils_notifications(booking_id,kind);
create table if not exists wils_auth_attempts(id bigserial primary key,ip_hash text not null,created_at timestamptz not null default now());
create index if not exists idx_wils_auth_attempts on wils_auth_attempts(ip_hash,created_at desc);
