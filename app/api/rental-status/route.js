import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabase } from "@/lib/supabase";

export async function GET(request) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const stripePaymentId = session.payment_intent;

    const { data: rental } = await getSupabase()
      .from("rentals")
      .select("netcode, rental_start, rental_expiry, locker_id, status")
      .eq("stripe_payment_id", stripePaymentId)
      .maybeSingle();

    return NextResponse.json({ rental: rental || null });
  } catch (err) {
    console.error("Rental status error:", err);
    return NextResponse.json({ rental: null });
  }
}
