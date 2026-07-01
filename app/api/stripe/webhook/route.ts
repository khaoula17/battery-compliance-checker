import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { setPlanByStripeCustomer } from "@/lib/db";
import type { Plan } from "@/lib/plans";

// Stripe webhook — keeps profile.plan in sync with subscription state.
// Configure the endpoint in Stripe and set STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Billing not configured" }, { status: 501 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!secret || !sig) throw new Error("Missing webhook secret/signature");
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const plan = (s.metadata?.plan as Plan) ?? "pro";
        if (s.customer) await setPlanByStripeCustomer(String(s.customer), plan);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === "active" || sub.status === "trialing";
        // Map the subscription's price back to a plan via env price IDs.
        const priceMap: Record<string, Plan> = {
          [process.env.STRIPE_PRICE_PRO ?? "_pro"]: "pro",
          [process.env.STRIPE_PRICE_WHITELABEL ?? "_wl"]: "whitelabel",
        };
        const priceIdValue = sub.items.data[0]?.price?.id ?? "";
        const plan: Plan = active ? priceMap[priceIdValue] ?? "pro" : "free";
        if (sub.customer) await setPlanByStripeCustomer(String(sub.customer), plan);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.customer) await setPlanByStripeCustomer(String(sub.customer), "free");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

export const dynamic = "force-dynamic";
