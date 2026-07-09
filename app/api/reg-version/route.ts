import { NextResponse } from "next/server";
import { rules } from "@/lib/compliance";

// GET /api/reg-version — exposes the active ruleset version so integrators (and
// a future "regulation changed" notifier) can detect updates.
export async function GET() {
  return NextResponse.json(
    {
      version: rules.version,
      edition: rules.edition,
      effectiveDate: rules.effectiveDate,
      lastReviewed: rules.lastReviewed,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

// Always serve fresh so integrators (and the reg-change automation) never read a
// stale version.
export const dynamic = "force-dynamic";
export const revalidate = 0;
