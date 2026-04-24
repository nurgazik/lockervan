import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";
import { generateNetCode } from "@/lib/codelocks";
import { getLockConfig } from "@/lib/lock-config";
import { sendPinToCustomer, alertOperator } from "@/lib/twilio";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const stripePaymentId = session.payment_intent;
  const customerEmail = session.customer_details?.email;
  const { locker_id: lockerId, customer_phone: customerPhone, duration_hours: durationHoursStr } = session.metadata || {};
  const durationHours = parseInt(durationHoursStr, 10);
  const amountCents = session.amount_total;

  // Idempotency check: skip if this payment was already processed
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("rentals")
    .select("id, netcode")
    .eq("stripe_payment_id", stripePaymentId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // Resolve lock config for location_id
  let locationId = null;
  try {
    const lockConfig = getLockConfig(lockerId);
    locationId = lockConfig.locationId;
  } catch {
    // Unknown locker — will still process but location_id will be null
    console.error(`Unknown locker ID in webhook: ${lockerId}`);
  }

  // Missing phone number — alert operator
  if (!customerPhone) {
    await supabase.from("rentals").insert({
      locker_id: lockerId,
      customer_phone: null,
      customer_email: customerEmail,
      netcode: null,
      rental_start: new Date().toISOString(),
      rental_expiry: new Date().toISOString(),
      duration_hours: durationHours,
      stripe_payment_id: stripePaymentId,
      amount_cents: amountCents,
      status: "failed",
      delivery_status: "failed",
      location_id: locationId,
    });

    await alertOperator("Missing phone number", {
      lockerId,
      customerPhone: null,
      customerEmail,
      stripePaymentId,
    });

    return NextResponse.json({ received: true });
  }

  // Generate NetCode with retry logic (up to 3 attempts)
  const rentalStart = new Date();
  const rentalExpiry = new Date(rentalStart.getTime() + durationHours * 60 * 60 * 1000);
  let netcode = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      netcode = await generateNetCode(lockerId, rentalStart, durationHours);
      break;
    } catch (err) {
      console.error(`Codelocks attempt ${attempt}/3 failed:`, err.message);
      if (attempt === 3) {
        // All retries exhausted — save as failed, alert operator
        await supabase.from("rentals").insert({
          locker_id: lockerId,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          netcode: null,
          rental_start: rentalStart.toISOString(),
          rental_expiry: rentalExpiry.toISOString(),
          duration_hours: durationHours,
          stripe_payment_id: stripePaymentId,
          amount_cents: amountCents,
          status: "failed",
          delivery_status: "failed",
          location_id: locationId,
        });

        await alertOperator("Code generation failed", {
          lockerId,
          customerPhone,
          customerEmail,
          stripePaymentId,
        });

        return NextResponse.json({ received: true });
      }
    }
  }

  // Save rental
  await supabase.from("rentals").insert({
    locker_id: lockerId,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    netcode,
    rental_start: rentalStart.toISOString(),
    rental_expiry: rentalExpiry.toISOString(),
    duration_hours: durationHours,
    stripe_payment_id: stripePaymentId,
    amount_cents: amountCents,
    status: "active",
    delivery_status: "pending",
    location_id: locationId,
  });

  // Send PIN via SMS
  try {
    await sendPinToCustomer(customerPhone, lockerId, netcode, rentalStart, rentalExpiry);

    await supabase
      .from("rentals")
      .update({ delivery_status: "sent" })
      .eq("stripe_payment_id", stripePaymentId);
  } catch (err) {
    console.error("SMS delivery failed:", err.message);

    await supabase
      .from("rentals")
      .update({ delivery_status: "failed" })
      .eq("stripe_payment_id", stripePaymentId);

    await alertOperator("SMS delivery failed", {
      lockerId,
      customerPhone,
      customerEmail,
      stripePaymentId,
    });
  }

  return NextResponse.json({ received: true });
}
