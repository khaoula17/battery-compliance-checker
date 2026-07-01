import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfile } from "@/lib/db";

// POST /api/stripe/portal — open the Stripe billing portal for the current user.
export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Billing not configured" }, { status: 501 });
  const profile = await getProfile();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 });
  }
  const origin = new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  });
  return NextResponse.json({ url: session.url });
}

export const dynamic = "force-dynamic";
