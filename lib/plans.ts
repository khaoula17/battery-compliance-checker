// Plan definitions, limits, and gating helpers — single source of truth.

export type Plan = "free" | "payg" | "pro" | "whitelabel";

export interface PlanDef {
  id: Plan;
  name: string;
  price: string;
  priceAnnual?: string; // displayed annual price (≈2 months free)
  /** Monthly check allowance. null = unlimited. */
  monthlyChecks: number | null;
  pdf: boolean;
  api: boolean;
  whiteLabel: boolean;
  stripePriceEnv?: string; // env var holding the monthly/one-time Stripe price ID
  stripePriceEnvAnnual?: string; // env var holding the annual Stripe price ID
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    monthlyChecks: 5,
    pdf: false,
    api: false,
    whiteLabel: false,
  },
  payg: {
    id: "payg",
    name: "Pay-as-you-go",
    price: "$19 / check",
    monthlyChecks: null,
    pdf: true,
    api: false,
    whiteLabel: false,
    stripePriceEnv: "STRIPE_PRICE_PAYG",
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: "$39 / mo",
    priceAnnual: "$390 / yr",
    monthlyChecks: null,
    pdf: true,
    api: false,
    whiteLabel: false,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    stripePriceEnvAnnual: "STRIPE_PRICE_PRO_ANNUAL",
  },
  whitelabel: {
    id: "whitelabel",
    name: "3PL White-label",
    price: "$249 / mo",
    priceAnnual: "$2,490 / yr",
    monthlyChecks: null,
    pdf: true,
    api: true,
    whiteLabel: true,
    stripePriceEnv: "STRIPE_PRICE_WHITELABEL",
    stripePriceEnvAnnual: "STRIPE_PRICE_WHITELABEL_ANNUAL",
  },
};

export function planFor(id: string | null | undefined): PlanDef {
  return PLANS[(id as Plan) ?? "free"] ?? PLANS.free;
}

/**
 * Whether paid billing is turned on. While false (pre-launch), the app is fully
 * free and generous: no usage limits, PDF open, and pricing shows "Start free"
 * instead of checkout — so nothing ever errors before Stripe is wired.
 */
export function billingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
}

export function canDownloadPdf(plan: string | null | undefined): boolean {
  return planFor(plan).pdf;
}

export function canUseApi(plan: string | null | undefined): boolean {
  return planFor(plan).api;
}

/** Returns true if the user is within their monthly check allowance. */
export function withinCheckLimit(plan: string | null | undefined, usedThisMonth: number): boolean {
  const limit = planFor(plan).monthlyChecks;
  if (limit === null) return true;
  return usedThisMonth < limit;
}
