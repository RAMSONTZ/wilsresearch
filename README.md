# WILS Research · One Vercel Website + Connected Booking

**Version:** 18 October 2026 | Unified Vercel / Next.js source

This is **one website/application**, not two websites. It preserves the original WILS Research circular homepage, research gallery, portraits, university visuals, green palette, fonts, menus, Services and About pages. Only the booking workflow, private administration, small hanging booking shortcut, and scroll anchoring were changed.

## Included

- Original homepage (16 circulating stories), original 61 image assets, Gallery/Services/About/Guide/Privacy/Contact sections, responsive light/dark theme.
- Hanging *BOOKING* phone/cord on the homepage. Click/tap it, use keyboard, or pull it downward to open the booking form.
- `/book/`: research proposal, SPSS, report, business/community surveys, research title, requested start and deadline, brief and priority; generates a random booking reference immediately.
- After creation: attempted automatic customer and admin email, and a **pre-filled WhatsApp message** containing reference, title, service, dates and amount. Client presses **Send** in WhatsApp. An approved WhatsApp Business Cloud API configuration can also deliver an automatic admin template notification.
- Airtel Money **0786609975**, Vodacom M-Pesa **0769394541**, CRDB **0152622768900**. Account/name shown as provided: **Ramadhani Majid Kabyemela**; bank beneficiary should be checked in the banking app before payment.
- Standard base research package **TZS 100,000**. Initial deposit **TZS 20,000**, remainder **TZS 80,000**. VIP priority adds **TZS 10,000** (upfront **TZS 30,000**, balance **TZS 80,000**, combined final **TZS 110,000**). Scope and schedules remain subject to agreement.
- `/booking-status/`: private status tracking link using a random 48-character token in the URL fragment (not sent via URL query).
- **Payment submission is not payment approval.** Admin checks receipt in Airtel, M-Pesa or CRDB independently. Only then is the project place reserved.
- Every **seven verified bookings** make a new project group. Project 1 places 1–7, Project 2 places 1–7, etc. PostgreSQL transaction and row lock prevent duplicated places. An unpaid booking receives no visible queue position.
- Private office: login, payment verification, search/filter, dashboard, CSV export, activity log, resend email, WhatsApp client updates, password change and forced logout. Admin route has no public navigation link.

## Deployment prerequisites

- Node.js 22
- A **dedicated Neon PostgreSQL** database for WILS (separate from KITAA's database)
- A **Vercel** account and a private GitHub repository, or Vercel CLI
- A verified email sending domain and Resend account if automatic email must be operational
- Optional: approved Meta WhatsApp Business API and approved 3-variable notification template

## Setup (the database and notification accounts are not embedded in this ZIP)

1. In Neon create a new WILS project. In its SQL Editor, execute `database/001_initial.sql` once.
2. Rename `.env.example` to `.env.local`. Provide `DATABASE_URL`, a random `APP_SECRET` of at least 32 characters (ideally `openssl rand -hex 32`), and an unrelated random `ADMIN_PATH_SEGMENT` (e.g. `openssl rand -hex 14`). **Do not use a weak or public admin path.**
3. Configure `WILS_ADMIN_EMAIL` and `WILS_ADMIN_INITIAL_PASSWORD` **locally**. Minimum initial password length 12 characters. From the project directory run `npm install`, then `npm run init:admin`. This adds one administrator. This script does not overwrite an existing admin or contain a default password. Remove the initial password from `.env.local` once set up.
4. Push the **source project folder** to your private GitHub repository (do not push `.env.local`). In Vercel choose **Add New Project > Import Git Repository**, select the repository, and use the Next.js framework preset. Add `DATABASE_URL`, `APP_SECRET`, `ADMIN_PATH_SEGMENT`, and (optionally) email/Meta secrets in **Project Settings > Environment Variables**. Deploy.
5. For email, verify a domain in your Resend account, provide `RESEND_API_KEY`, set `RESEND_FROM` to an email address on **that verified domain**, and set `ADMIN_NOTIFICATION_EMAIL=wilsresearch7@gmail.com`. Without these, the booking works but automated emails are skipped. Do not claim delivery unless the provider returns sent.
6. Configure Meta only if you have a **WhatsApp Business Cloud API** account and an approved template named according to `META_WHATSAPP_TEMPLATE_NAME`; parameters must be in order: booking reference, customer name, service. The fallback is WhatsApp click-to-chat (opens a prepared message, but the client must press Send). Personal WhatsApp cannot be used to silently send automated messages.
7. Visit the website `/book/`, submit a test booking using your own email, check the email/WhatsApp handoff, report a **real** test transaction, log in to the private office and approve it only after checking your receiving account. Verify Project 1 Place 1. Repeat with seven tests to verify Group 2 Place 1. **Do not use fake transactions for approval.**

### How to reach the private office

`https://YOUR-DOMAIN/office/YOUR_ADMIN_PATH_SEGMENT/`

The private office page is not exposed through menus; `/admin/` returns 404. This hidden path is **not an authentication substitute**: admins still need credentials and cookies. Password hashes use `scrypt` and per-user random salts; authenticated sessions use random tokens, their server-side hashes, HttpOnly/SameSite cookies, rate-limited login attempts and expiry. Admin password changes revoke existing sessions. No security measure can promise a system is unhackable; keep credentials secret and your packages updated.

## Important: WhatsApp vs email

On a customer's form submission:
- WILS stores a booking record **first**, then requests **two email sends** (client and administrator) if configured; status is available to the booking screen.
- The browser displays a personalized WhatsApp link. WhatsApp opens with completed details and the user **presses Send**. An automatic **admin** WhatsApp template may be dispatched only with approved Meta Cloud API credentials.
- A reference means *booking requested*, **not payment confirmed**. The private link reflects verified status and any assigned group/position.

## Architecture

- Next.js App Router deployed on Vercel: `app/route.js`, `app/[...slug]/route.js`, `app/api/[...action]/route.js`.
- Public static WILS design and all its source images: `public/`. Private administration HTML: `private-pages/admin.html`.
- Backend: `lib/server.js` (validation, RBAC, rate-limiting), `lib/db.js` (PostgreSQL), `lib/notices.js` (notifications), `lib/security.js` (passwords, sessions, tokens).
- Database: `database/001_initial.sql` (schema/indices/audit/outbox).
- Audit can be inspected in `wils_admin_audit` in Neon. Back up your database using Neon point-in-time recovery or scheduled database exports, according to your Neon plan.

## Testing

`npm test` runs offline tests for credential hashing, phone validation, private routes and original asset links. `npm run check:syntax` checks key backend syntax. **Run `npm run build` after installing dependencies** and perform real end-to-end testing after Vercel + Neon + Resend configuration. This package cannot be fully validated against your live infrastructure without its credentials. The frontend and source files are included; node_modules and secrets are intentionally excluded.

## Data protection and operational cautions

Do not enter identifiable patient data into WhatsApp, emails or booking notes. Ask clients to transfer de-identified datasets using an agreed secure channel. Restrict database access to authorized users, set a retention/deletion policy and keep access/audit records. Never accept a client's payment claim as proof; verify independently. Business and university affiliations are retained only from the prior approved WILS website source; do not suggest institutional endorsement unless you have written authorization.
