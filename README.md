# OmniRemind

WhatsApp appointment reminders for independent clinics, with additional workspace types available for schools and retail shops. Each business connects its own Meta account and pays Meta directly. OmniRemind sending credits are an internal queue allowance, separate from Meta billing; a zero balance pauses due reminders.

## Modules

- Workspace: Supabase auth, one membership per business, row-level security on every tenant table. Meta tokens live in `meta_secrets`, which authenticated users cannot read.
- Queue: reminders sit in Postgres until `send_at`. Supabase `pg_cron` calls `/api/cron/dispatch` once a minute. The route claims at most eight due rows per pass, with a skip lock so two ticks cannot send the same row.
- Delivery: the dispatcher calls the WhatsApp Cloud API with that tenant template. `/api/webhooks/whatsapp` verifies the tenant app secret and moves status from sent to delivered to read. The dashboard can total estimated values associated with read reminders; read receipts do not prove an appointment happened or an invoice was paid.

## Free-tier shape

- App host: designed to start on Vercel Hobby, whose cron is daily and only works as a backlog sweep. Minute timing comes from Supabase `pg_cron` and `pg_net`.
- Data: designed to start on Supabase free Postgres and Auth.
- Free-tier allowances, product terms, and limits can change. Monitor usage and plan for paid infrastructure if traffic grows.
- Idle cost: two indexed database calls per minute. A busy minute sends about eight templates, which fits a short serverless run.
- Throughput past that waits for the next minute. That is the ceiling that keeps the project inside free limits.

## Setup

1. Create a Supabase project and run `supabase/001_init.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the URL, anon key, and service role key.
3. Set `CRON_SECRET`, `WHATSAPP_VERIFY_TOKEN`, and `PLATFORM_ADMIN_EMAILS` to your operator email.
4. For a local demo only, set `ALLOW_SELF_TOPUP=true`. Leave it unset on the deployed app.
5. In Supabase Auth, turn off email confirmation if you want signup to enter the workspace immediately.
6. `npm run dev`, create a workspace, then open Operator (or the wallet, if self top-up is on) and add credits.
7. In WhatsApp settings, save the business phone number ID, access token, app secret, and the approved utility template name.
8. Deploy to Vercel with the same env vars and `NEXT_PUBLIC_APP_URL`. Enable `pg_cron` and `pg_net`, edit `supabase/cron.sql`, and run it once.
9. In each Meta app, set the callback URL shown on the WhatsApp page and the verify token.

Vercel Hobby cron in `vercel.json` runs once a day as a backup. Without `pg_cron`, reminders wait for that daily sweep.

## Schedule a reminder

- Dashboard form
- CSV or Excel import, up to 500 rows. Sample: `/sample-reminders.csv`
- `POST /api/v1/reminders` with `Authorization: Bearer omni_...`

Send times without a zone are the workspace timezone. Values such as `2026-12-01 09:00` or a full ISO instant are accepted.

## Credits

The operator grants OmniRemind sending credits. Each send reserves one credit first and refunds it if Meta rejects the call. These credits are an internal queue allowance, not Meta prepaid balance or payment. Meta bills the business separately. A zero balance marks due reminders paused and does not call Meta. Adding credits releases paused rows.

`npm run check` runs the phone, money, timezone, and status checks.
