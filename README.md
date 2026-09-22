# WILS Research

WILS Research is a Next.js booking, client portal, and owner dashboard for academic, medical, and business research support. The interface uses Motion, Lucide, and a Supabase-ready data boundary.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor**, paste [supabase/schema.sql](supabase/schema.sql), and run it once.
3. If the base script was already run, paste [supabase/workflow-migration.sql](supabase/workflow-migration.sql) and run it. This adds the payment gate and client deliverable Storage policy.
4. In **Authentication > Providers > Email**, disable **Confirm email** for this email-as-username flow. No verification email is sent when confirmation is disabled.
5. Create the owner account in **Authentication > Users** with an email and password.
6. Copy `.env.local.example` to `.env.local` and fill in the project URL and publishable key. Keep the service-role key server-only.
7. Set the owner profile to admin after the owner account exists:

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID_FROM_SUPABASE_AUTH_USERS';
```

The Supabase boundaries are [lib/supabase/browser.ts](lib/supabase/browser.ts) and [lib/supabase/server.ts](lib/supabase/server.ts). Use the browser client for interactive client features and the server client for Server Components, Route Handlers, and Server Actions. Never import a service-role key into client code.

The page uses Supabase Auth and relational queries for email/password client booking and login, admin login, payments, payment confirmation, deliverable uploads, and signed downloads. The client email is the username. Disable email confirmation in Supabase to prevent verification messages; Auth still has abuse protection, but this flow does not use anonymous sign-ins.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The local preview client is `Aisha2026` / `WR-48291`; the local admin bridge accepts `WILS-2026`. Replace these preview handlers before production.

The floating WhatsApp action links to `0786609975` using the international `wa.me/255786609975` format.

## Checks

```bash
npm run lint
npm run build
```
