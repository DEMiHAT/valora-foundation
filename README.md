# Valora Foundation — V1

Next.js 16 / React 19 / TypeScript / Tailwind 4 / Framer Motion. Foundation-first public website, reusable event configuration, on-site registration, secure Razorpay checkout, protected organiser operations, automatic payment confirmation, allocation, and secure E-cards sent using Nodemailer.

## Start locally

Requires Node.js 22.22+ and npm. Use Node 22 or 24 on Vercel.

```bash
npm ci
npm run setup:local
npm run dev
```

`setup:local` creates `.env.local` with a random organiser password, a scrypt password hash, a session secret and a worker secret. It prints the organiser credentials **once** and will not overwrite an existing environment file. Save the password securely. Visit `http://localhost:3000` and `/admin/login`.

The local datastore is `.data/state.json`; it is ignored by source control. It uses a file lock and atomic file replacement. It is for development only. Production operations require the Apps Script adapter because Vercel filesystem writes are not durable.

Run `npm run typecheck`, `npm test`, and `npm run build` to validate the shared domain and application. Live payment delivery requires your Razorpay test credentials and webhook deployment.

## What's implemented

- Public `/`, `/about`, `/initiatives`, `/events`, `/partners`, `/media`, `/contact`, privacy and event terms pages using the original Valora crest and post identity.
- `/events/valora-mun` and `/events/valora-mun/register`: on-site participant details, ranked committee preferences, Razorpay checkout, saved-session retry and payment status recovery.
- `/admin`: overview, searchable participants and status filters, payment reference review/correction, manual verification/rejection, allocation capacity and portfolio views, manual overrides, digital ID controls, editable matrices, manual response imports, email delivery status and organiser audit records.
- Automatic allocation after verified payment: ordered preferences, capacity checks, next free portfolio, manual-allocation fallback, idempotent retries.
- Stable participant identity across events, event-specific E-ID and random secure QR identifier. Regeneration and allocation overrides rotate the token. Revocation and expiry prevent valid entry verification.
- `/id/[token]` printable delegate card and PNG download; `/verify/[id]?token=...` minimal verification; `/verify` camera scanner where supported plus a secure-link fallback.
- Nodemailer allocation email with a real 900 × 1120 PNG E-card attachment. Receipt/rejection emails use the same replaceable transport and durable outbox.
- Google Forms submit trigger and a shared domain bundle used by both local operations and Apps Script; clean normalized Sheets views with a committed snapshot to recover from partial multi-tab writes.

## Enable Razorpay payments

Set these server environment variables in `.env.local` or your hosting environment:

```dotenv
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
PAYMENT_REFUND_POLICY="Your actual cancellation and refund policy."
VALORA_MUN_MATRIX_APPROVED=true
```

Checkout stays closed until these values are set. Start with Razorpay **test keys**. In the Razorpay Dashboard enable automatic capture and configure `https://your-domain/api/payments/webhook` for **payment.captured** and **order.paid**, using the same webhook secret. Production still uses the existing Apps Script datastore: run `npm run build:apps-script`, copy the generated `apps-script/Domain.gs` and updated `apps-script/Code.gs` into your Apps Script project, redeploy, and set `MATRIX_APPROVED=true` in its Script Properties. Never expose API secrets in `NEXT_PUBLIC_` variables.

`POST /api/payments/order` validates the registration and creates an order with the server-configured fee in paise. Checkout receives only the public key, order and signed registration token. `POST /api/payments/verify` checks the signature and fetches payment evidence from Razorpay; only a matching **captured**, full-amount INR payment can fulfil the registration. Authenticated webhooks provide recovery if the browser closes. Settlement, allocation and E-ID issuance are atomic and idempotent under the existing datastore lock. Authorised payments remain pending until capture. `/api/payments/status` accepts the signed checkout token, reconciles captured order payments directly with Razorpay when needed, and returns only confirmation/status, without participant details or E-ID tokens.

A saved checkout can be resumed in the same browser tab after cancellation, payment failure or reload. If the tab is lost, organisers can locate the pending registration by email; there is no public lookup by email that exposes or takes over another delegate’s checkout. Existing Google Form records and manual UPI admin actions remain available for historical/imported payments. Gateway records cannot be manually marked paid, rejected or edited. Refunds are handled through the Razorpay Dashboard and organiser support; this integration does not create refunds or automatically revoke E-IDs on refunds/disputes.

Before going live, test success, failure, cancellation/resume, webhook-only completion and replay with Razorpay test keys, verify emails and E-IDs, then replace the test keys with live keys and configure the live webhook. The external form is now optional and used only for legacy organiser imports; see [Apps Script setup](apps-script/README.md).

## Interactive visuals

The homepage now uses locally rendered Three.js sculptures: a gold orbital globe, a torus knot and a sculptural bloom selected through the value controls. The committee explorer includes a 3D assembly that highlights the selected committee. A physical delegate pass tilts with the pointer and flips to reveal kit inclusions on the homepage and event page.

Three.js is dynamically imported as scenes approach the viewport. Rendering pauses offscreen and in hidden tabs, pixel ratio is capped, and reduced-motion preferences disable automatic rotation. Geometry, materials and renderers are disposed on unmount. Devices without WebGL use a CSS sculpture fallback.

To use your own published Spline scenes, configure one or more of:

```dotenv
SPLINE_SCENE_URL=https://my.spline.design/your-hero-scene/
SPLINE_EXPERIENCE_URL=https://my.spline.design/your-delegate-kit-scene/
SPLINE_COMMITTEE_URL=https://my.spline.design/your-committee-scene/
```

Only HTTPS embeds on `my.spline.design` are accepted. These optional embeds follow [Spline’s public URL export](https://docs.spline.design/exporting-your-scene/web/exporting-as-public-ur-ls). No published Spline scenes are bundled; the local 3D scenes work without an external account or scene URL. Spline-embedded scenes have their own interaction and motion settings, which should be configured in the Spline editor before publishing.

## Enable Nodemailer E-card sending

Set these values in `.env.local` or Vercel:

```dotenv
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-workspace-mailbox@example.org
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-workspace-mailbox@example.org
```

Use your mail provider's SMTP credentials; Gmail/Workspace commonly requires an app password and account policy support. `EMAIL_FROM` is a single email address, not a display-name string. The sender display name is “Valora Foundation”. Port 465 uses TLS immediately; port 587 requires STARTTLS. Certificate validation stays enabled. The SMTP adapter disables remote attachment fetching and arbitrary file attachment paths. See [Nodemailer SMTP documentation](https://nodemailer.com/smtp) and [Gmail guidance](https://nodemailer.com/usage/using-gmail/).

After importing a response or verifying payment, the Next.js route commits the record and uses `after()` to process the outbox. If SMTP is not configured, the queued email remains pending. An SMTP acceptance is recorded as `SENT`; this does not guarantee inbox delivery. Review provider delivery reports when needed.

For imported Google Forms responses and automatic retry, configure `CRON_SECRET` (32+ random characters) in Vercel, the matching `EMAIL_WORKER_SECRET` in Apps Script, and `EMAIL_WORKER_URL=https://your-domain/api/email/process`. Run `installEmailWorkerTrigger()` in Apps Script once to wake the worker every minute. Alternatively use the “Send pending emails” action in `/admin/activity`, or a scheduler calling the authenticated worker endpoint. Do not send worker secrets to the browser.

The outbox uses leases, stable message IDs, bounded retries and backoff. Replaced/revoked/expired E-cards are skipped. Delivery is **at-least-once**: if the SMTP server accepts a message but the final datastore acknowledgement fails, a retry can deliver a duplicate. Allocation and credential issuance remain idempotent. Explicit organiser resends are recorded without discarding the original sent-message history.

## Content and future events

- `src/data/foundation.ts`: mission, initiatives, team, partners, media and announcements. Leadership and partner arrays are empty until confirmed. Future programme descriptions are marked as forthcoming.
- `src/data/events.ts`: event identity, slug, dates, venue, fee, fields, preference count, categories, capacities, content, inclusions, FAQs, allocation rule, ID prefix and external form environment key.
- `src/data/portfolios.ts`: initial **draft** portfolio matrices. The Lok Sabha/AIPPM drafts are role/party placeholders, not approved personalities or an official political matrix.
- `/admin/settings`: edit the operational ordered matrices and capacities. Occupied portfolios cannot be removed or reassigned twice. These overrides are persisted in the datastore and do not overwrite source files.

Add another event object with unique `id`, `slug`, `idPrefix`, `formEnvKey` and `matrixApprovalEnvKey`. Add its own fields/categories/matrix and event copy. The same dynamic routes, dashboard, payment flow, allocation and E-card system handle it. Ordered preference allocation is the V1 rule; a different algorithm can be added to the domain without changing the frontend/storage interface. Future attendance and certificates can reference participant IDs and event registrations; V1 includes their identity foundation, not an attendance or certificate generator.

After changing source event configuration, run `npm run build:apps-script` and update `Config.gs` / `Domain.gs` in Apps Script. Public capacities come from source event configuration; update source capacity too if you change the published number of delegate places in the admin matrix.

The school delegation portal at `/events/valora-mun/delegation` supports 2–30 students per order. Each student has distinct contact details and committee preferences; the teacher pays the full roster in one Razorpay order. The shared payment settlement allocates every student and issues individual E-IDs. Redeploy `apps-script/Code.gs` and the generated `apps-script/Domain.gs` before enabling this flow in production. Test the full flow with Razorpay test keys and a restricted test Sheet. The portal remains closed until the existing payment readiness settings are complete.

Committee emblem assets are stored in `public/committees/` and their source links are in `src/data/committee-logos.ts`. These identify institutions represented in Model UN simulations and do not imply affiliation or endorsement. AIPPM is a Model UN format with no single institutional logo, so `aippm-valora.svg` is a Valora-specific emblem. Review emblem-use permissions before publication; the [UN explicitly disallows its emblem in Model UN promotional material](https://www.un.org/en/mun/faq), and [WHO](https://www.who.int/about/policies/publishing/copyright) and [UNFCCC](https://unfccc.int/about-us/press-and-media/frequently-asked-questions) restrict use of their official marks.

Draft matrices must be reviewed before live import. Set `VALORA_MUN_MATRIX_APPROVED=true` in Vercel and the event approval setting in Apps Script after review. Development imports remain available to exercise the workflow.

## Architecture

`public UI → external form → form submit trigger → repository → payment verification → shared allocation domain → E-ID → outbox → Nodemailer`

`Repository` in `src/lib/repository.ts` isolates persistence. `src/lib/domain.ts` contains event-agnostic business rules. The generated `apps-script/Domain.gs` bundles the **same** implementation and boundary validators, so Sheets and local development do not diverge. Replacing Sheets with PostgreSQL requires a new repository adapter and a transaction around operations; the public/frontend contracts remain unchanged. `PaymentProvider` and `EmailTransport` isolate later provider changes.

The visible Sheets tabs are Participants, Registrations, Committees, Portfolios, Allocations, Credentials, Outbox and Audit. Portfolios include `event_id` so committees with the same ID in two events remain isolated. Do not edit projected tabs directly: use the dashboard. A protected hidden `_State` snapshot is authoritative. See the Apps Script guide for backups and recovery.

## Deployment: Vercel + Cloudflare

1. The Vercel project uses the Next.js preset, install `npx --yes npm@11.21.0 ci`, build `npm run build`, and Node.js 22 or 24. `vercel.json` pins npm for reproducible cloud installs; `.npmrc` packs local vendor dependencies. Regenerate the lock file with npm 11 in a clean directory when changing dependencies.
2. Set `DATA_PROVIDER=apps-script`, `APP_URL` to the canonical HTTPS origin, `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`, `SESSION_SECRET` (32+ random characters), `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, the form URL, matrix approval, SMTP settings and `CRON_SECRET`. Use unique production credentials. Never set `NEXT_PUBLIC_` on secrets.
3. Deploy the included Apps Script files and run the setup/trigger steps in its README. Keep the operational Sheet restricted to organisers.
4. Add the domain in Vercel. In Cloudflare DNS, use the exact records Vercel supplies for your project. Start with DNS-only records until verification and TLS work. If enabling Cloudflare proxy/CDN, use Full (strict) TLS and bypass caching for `/admin*`, `/api/*`, `/id/*` and `/verify*`. Do not apply a “cache everything” rule to private event operations. See [Vercel domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain) and [Cloudflare DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/).
5. Test with an organiser-controlled email and Razorpay test keys: website registration → checkout → captured payment → one allocation → one E-ID → attached card → QR verification. Test regeneration/revocation, mobile navigation and printing on the deployed site.

The public website is deployed at https://valora-mu-beryl.vercel.app (Vercel project `demihats-projects/valora`). Homepage, registration and sitemap returned HTTP 200 after deployment. Payments and organiser operations remain unavailable until the Razorpay, Apps Script and SMTP configuration is supplied. Live payments and email delivery have not been verified.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

Tests cover full capacity, fallback preferences, duplicates/idempotence, future-event isolation, matrix edits, overrides, token rotation/revocation/expiry, authentication tampering/expiry, rate limiting, email leases/retries, multipart attachment composition and actual PNG rendering. The Apps Script adapter tests run its bundled code in a mocked Google runtime, including pre-commit failure, projection recovery, external form mapping, API authentication and delivery acknowledgement. They do not substitute for a live Google/SMTP integration check.

Vendored QR, Nodemailer and fonts carry their licences in `vendor/`. Vendoring was necessary because the package registry was unreachable in this workspace. No credentials are committed. The schema and all dependencies are reproducible through `package-lock.json`.
