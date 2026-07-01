import Stripe from "stripe";

// Stripe client — null when not configured so the app builds/runs without billing.
export const isStripeConfigured = (): boolean => !!process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = isStripeConfigured()
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })
  : null;

export function priceId(envName?: string): string | undefined {
  if (!envName) return undefined;
  return process.env[envName];
}
