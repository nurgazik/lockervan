import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const VALID_PRICES = {
  3: 300,
};

const DURATION_LABELS = {
  3: "3 Hours",
};

export async function POST(request) {
  try {
    const { lockerId, phone, durationHours, priceInCents } = await request.json();

    if (!lockerId || !phone || !durationHours || !priceInCents) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    if (VALID_PRICES[durationHours] !== priceInCents) {
      return NextResponse.json({ error: "Invalid price or duration." }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Locker ${lockerId} — ${DURATION_LABELS[durationHours]}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        locker_id: lockerId,
        customer_phone: phone,
        duration_hours: String(durationHours),
      },
      success_url: `${request.nextUrl.origin}/locker/${lockerId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/locker/${lockerId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
