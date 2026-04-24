# LockerVan

Smart locker rental MVP. A favour build, not a venture. Keep everything lean. No over-engineering.

See @PRD.txt for full product requirements, customer flow, data model, and technical architecture.

## Tech Stack

- Next.js (App Router) with JavaScript
- Supabase (Postgres database, auth for operator access)
- Stripe Checkout (payments; phone number collected on booking page, passed as metadata)
- Twilio (SMS delivery for PIN codes and operator failure alerts)
- Codelocks NetCode API (time-based PIN generation for offline locks)
- Deployed to Vercel

## Project Structure

```
/app              → App Router pages and layouts
/app/locker/[id]  → Customer booking page (scanned via QR code)
/app/api/webhooks/stripe → Stripe webhook handler (critical path)
/lib              → Shared utilities, Supabase client, Twilio/Codelocks helpers
```

## Key Commands

```
npm run dev       → Local dev server
npm run build     → Production build
npm run lint      → Lint check
```

## Code Style

- Plain JavaScript, no TypeScript
- ES modules (import/export), not CommonJS
- Prefer named exports

## Critical Rules

IMPORTANT: Never assume. If an instruction or requirement is unclear, ask clarifying questions before proceeding.

IMPORTANT: Always use established, out-of-the-box libraries, patterns, and best practices. Custom code only when absolutely necessary.

IMPORTANT: This is a lean MVP. Do not add features, abstractions, or infrastructure not in the PRD. When in doubt, choose the simpler approach.

IMPORTANT: The Stripe webhook handler is the most sensitive part of the system. It must: verify webhook signature, be idempotent using stripe_payment_id as the key (unique constraint in DB), respond within 5 seconds, retry Codelocks API up to 3 times on transient failure, then alert operator via SMS if still failing.

IMPORTANT: No custom admin dashboard. The operator uses the Supabase Table Editor directly.

IMPORTANT: SMS only for PIN delivery. No email delivery in V1.

## External Docs

- Stripe Checkout: https://docs.stripe.com/payments/checkout
- Stripe Webhooks: https://docs.stripe.com/webhooks
- Twilio SMS: https://www.twilio.com/docs/messaging/quickstart/node
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- Codelocks NetCode API: see docs/codelocks-api.md for full reference

## Environment Variables

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
OPERATOR_PHONE_NUMBER
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CODELOCKS_API_KEY
CODELOCKS_API_URL
CODELOCKS_ACCESS_KEY
```

## Codelocks NetCode API (Quick Reference)

Full docs: docs/codelocks-api.md

- Base URL: `https://api-connect.codelocks.io/n/3`
- Auth: `x-api-key` header
- Generate code: `GET /n/3/netcode/{timecode}?identifier={lockId}&lockmodel=KL1060G3&start={YYYY-MM-DD HH:MM}&duration={durationId}`
- Response: `{ "ActualNetcode": "7830719", "Expires": "...", ... }`
- KL1200N locks use API model **`KL1060G3`** (7-digit codes)
- **Send times in fixed UTC-8 (PST standard), NOT PDT/UTC** — lock clock does NOT adjust for daylight saving
- Duration IDs: add +1hr to compensate for round-down → 1hr rental=duration 1, 3hr rental=duration 3, 5hr rental=duration 5
- Start times must be on the hour (round down)
- `timecode` (path) = lock initialization timestamp without separators (e.g. `202604221226`)
- `identifier` (query) = six digit lock identifier (e.g. `921239`)
