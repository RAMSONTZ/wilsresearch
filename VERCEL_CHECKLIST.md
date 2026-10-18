# Vercel deployment checklist

- [ ] Create a separate Neon database, run `database/001_initial.sql`
- [ ] Create strong `APP_SECRET` and a random `ADMIN_PATH_SEGMENT`; keep both in Vercel secret environment variables
- [ ] Initialize the first admin with `WILS_ADMIN_EMAIL` / `WILS_ADMIN_INITIAL_PASSWORD` using `npm run init:admin`, then clear initial password
- [ ] Publish the project through private GitHub → Vercel (Next.js preset, Node 22)
- [ ] Connect and verify domain DNS for Vercel and Resend
- [ ] Set `RESEND_API_KEY`, `RESEND_FROM` (verified sender), `ADMIN_NOTIFICATION_EMAIL`
- [ ] Optionally configure approved WhatsApp Business API template and sender number
- [ ] Test standard and VIP amounts; validate phone, title, dates, tracking reference
- [ ] Test email to the admin and client, and client WhatsApp handoff separately
- [ ] Test that payment claims remain **pending** until the administrator independently verifies them
- [ ] Test groups after approvals #1 through #8 (Project 1 / positions 1–7; Project 2 / position 1)
- [ ] Test login rate limiting, hidden admin URL, change password/sign out, search/export, and mobile light/dark
- [ ] Confirm payment recipient names and CRDB account details with the financial provider before accepting money
- [ ] Conduct a privacy/security review and confirm data processing retention practices before public launch
