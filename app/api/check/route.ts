import { NextResponse } from "next/server";
import { runCheck, type ShipmentInput } from "@/lib/compliance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile, countChecksThisMonth, saveCheck } from "@/lib/db";
import { withinCheckLimit, planFor, billingEnabled } from "@/lib/plans";

// POST /api/check  — run a single pre-flight compliance check.
// When auth is configured: enforces the plan's monthly limit and saves the
// check to the user's history. Works anonymously when auth is not configured.
export async function POST(req: Request) {
  let body: ShipmentInput;
  try {
    body = (await req.json()) as ShipmentInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.chemistry || !body?.configuration || !body?.itemType) {
    return NextResponse.json(
      { error: "chemistry, configuration and itemType are required" },
      { status: 400 }
    );
  }

  // Auth-aware gating + persistence (only when Supabase is configured).
  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    const profile = await getProfile();
    if (profile) {
      userId = profile.id;
      // Only enforce the monthly allowance once paid billing is live.
      const used = billingEnabled() ? await countChecksThisMonth(profile.id) : 0;
      if (billingEnabled() && !withinCheckLimit(profile.plan, used)) {
        const limit = planFor(profile.plan).monthlyChecks;
        return NextResponse.json(
          { error: `Monthly limit reached (${limit} checks on the ${planFor(profile.plan).name} plan). Upgrade to continue.`, code: "LIMIT_REACHED" },
          { status: 402 }
        );
      }
    }
  }

  try {
    const result = runCheck(body);
    if (userId) await saveCheck(userId, body, result);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Check failed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
