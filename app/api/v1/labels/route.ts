import { NextResponse } from "next/server";
import { runCheck, type ShipmentInput } from "@/lib/compliance";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { findApiKeyOwner } from "@/lib/db";
import { canUseApi } from "@/lib/plans";

// REST API for freight forwarders / 3PLs.
// POST /api/v1/labels
//   Header: Authorization: Bearer <api-key>
//   Body: { shipments: ShipmentInput[] }  (or a single ShipmentInput)
//   Returns: { results: CheckResult[] }
//
// Auth: when Supabase is configured, the bearer token is validated against the
// `api_keys` table and the owner's plan must include API access. Otherwise it
// falls back to a single shared API_INTERNAL_KEY (useful for local/dev).
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();

  if (isSupabaseConfigured()) {
    if (!token) return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    const owner = await findApiKeyOwner(token);
    if (!owner) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    if (!canUseApi(owner.plan)) {
      return NextResponse.json({ error: "API access requires the White-label plan." }, { status: 402 });
    }
  } else {
    const expected = process.env.API_INTERNAL_KEY;
    if (expected && token !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const shipments: ShipmentInput[] = Array.isArray(body?.shipments)
    ? body.shipments
    : body?.chemistry
    ? [body as ShipmentInput]
    : [];

  if (shipments.length === 0) {
    return NextResponse.json(
      { error: "Provide a shipment object or { shipments: [...] }" },
      { status: 400 }
    );
  }

  try {
    const results = shipments.map((s) => runCheck(s));
    return NextResponse.json({ count: results.length, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Batch check failed" },
      { status: 500 }
    );
  }
}
