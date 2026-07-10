import { NextResponse } from "next/server";
import { rules } from "@/lib/compliance";
import { isSupabaseConfigured, SUPABASE_URL } from "@/lib/supabase/config";
import { billingEnabled } from "@/lib/plans";
import { isStripeConfigured } from "@/lib/stripe";
import { aiProvider } from "@/lib/ai/sds";
import { LEGAL } from "@/lib/legal";

// GET /api/health — a safe diagnostic (no secrets). Use it to see exactly which
// services are configured and whether Supabase is reachable. This is how you
// diagnose a "failed to fetch" sign-in: if supabaseReachable is false or the
// host looks wrong, the NEXT_PUBLIC_SUPABASE_URL env var is misconfigured.
export const dynamic = "force-dynamic";

export async function GET() {
  let supabaseHost: string | null = null;
  let supabaseReachable: boolean | null = null;

  if (SUPABASE_URL) {
    try {
      supabaseHost = new URL(SUPABASE_URL).host;
    } catch {
      supabaseHost = "INVALID_URL — check NEXT_PUBLIC_SUPABASE_URL";
    }
    if (supabaseHost && !supabaseHost.startsWith("INVALID")) {
      try {
        const res = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/health`, {
          cache: "no-store",
        });
        // 200 = healthy; 401 still means the host is reachable (just needs a key).
        supabaseReachable = res.ok || res.status === 401;
      } catch {
        supabaseReachable = false;
      }
    }
  }

  return NextResponse.json(
    {
      ok: true,
      ruleset: rules.version,
      config: {
        supabaseConfigured: isSupabaseConfigured(),
        supabaseHost,
        supabaseReachable,
        billingEnabled: billingEnabled(),
        stripeConfigured: isStripeConfigured(),
        aiProvider: aiProvider() ?? "none",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
        companyInfoSet: !LEGAL.company.includes("["),
        aiUploadEnabled: process.env.NEXT_PUBLIC_AI_ENABLED === "true",
      },
      hint:
        "sign-in needs supabaseConfigured=true AND supabaseReachable=true. If reachable is false or the host is wrong, fix NEXT_PUBLIC_SUPABASE_URL in Vercel and redeploy (no cache).",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
