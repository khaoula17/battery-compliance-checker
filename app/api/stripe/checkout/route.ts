import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getProfile, linkStripeCustomer } from "@/lib/db";
import { planFor, type Plan } from "@/lib/plans";

// POST /api/stripe/checkout  body: { plan: "pro" | "payg" | "whitelabel" }
// Creates a Stripe Checkout session for the signed-in user.
export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 501 });
  }
  const profile = await getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { plan, annual } = (await req.json()) as { plan: Plan; annual?: boolean };
  const def = planFor(plan);
  const envName = annual && def.stripePriceEnvAnnual ? def.stripePriceEnvAnnual : def.stripePriceEnv;
  const price = envName ? process.env[envName] : undefined;
  if (!price) {
    return NextResponse.json({ error: `No Stripe price configured for ${plan}${annual ? " (annual)" : ""}.` }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  // Ensure a Stripe customer exists for this user.
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      metadata: { user_id: profile.id },
    });
    customerId = customer.id;
    await linkStripeCustomer(profile.id, customerId);
  }

  const isSubscription = plan !== "payg";
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/#pricing`,
    metadata: { user_id: profile.id, plan },
  });

  return NextResponse.json({ url: session.url });
}

export const dynamic = "force-dynamic";
