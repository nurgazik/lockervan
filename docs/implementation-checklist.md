# LockerVan Implementation Checklist

## Done
- [x] Booking page (`/app/locker/[id]/page.js`) — phone + duration picker + Stripe redirect
- [x] Checkout API (`/app/api/checkout/route.js`) — creates Stripe session with metadata
- [x] Webhook handler (`/app/api/webhooks/stripe/route.js`) — signature verify, idempotency, retry logic, operator alerts
- [x] Success page (`/app/locker/[id]/success/page.js`) — shows PIN, start/expiry times
- [x] Rental status API (`/app/api/rental-status/route.js`) — polls for rental data
- [x] Supabase schema (`/supabase/schema.sql`) — rentals table with unique constraint
- [x] Twilio helpers (`/lib/twilio.js`) — sendPinToCustomer, alertOperator
- [x] Supabase client (`/lib/supabase.js`)
- [x] Stripe client (`/lib/stripe.js`)
- [x] Codelocks API research + docs (`/docs/codelocks-api.md`)
- [x] Stripe test keys in `.env.local`
- [x] Codelocks API key in `.env.local`
- [x] Supabase credentials in `.env.local`
- [x] Supabase schema run in SQL Editor
- [x] Verified API generates working codes on physical lock
- [x] `lib/codelocks.js` — real API integration (timezone logic, duration mapping)
- [x] Lock config system (`/lib/lock-config.js`) — maps locker IDs to Codelocks timecodes/identifiers
- [x] Booking page UI — updated to show only 3hr/$3 option for V1
- [x] Checkout API — updated to accept only 3hr/$3 for V1
- [x] Webhook handler — updated to use lock config for location_id per locker
- [x] Expired code behavior tested — ~15-25 min grace period confirmed

## Blocked on Credentials
- [ ] Twilio account — need SID + auth token + Canadian phone number
- [ ] Stripe webhook secret — need Stripe CLI (`stripe listen`) or deploy to Vercel

## After Credentials
- [ ] End-to-end test: booking → Stripe payment → webhook → Codelocks API → SMS delivery
- [ ] Deploy to Vercel
- [ ] Configure production Stripe webhook endpoint
- [ ] Register all 12-18 pilot lockers in Codelocks Connect Portal
- [ ] Generate QR codes for each locker URL

## Open Questions
- Confirm lock behavior: can a locked locker be opened by a new customer's code? (items left after expiry — PRD Section 10)
