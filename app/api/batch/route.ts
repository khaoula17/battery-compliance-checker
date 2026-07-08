import { NextResponse } from "next/server";
import { runCheck, type ShipmentInput } from "@/lib/compliance";

// POST /api/batch  body: { shipments: ShipmentInput[] }
// Runs a compliance check on each row and returns per-row results. Used by the
// /batch tool for freight forwarders processing many shipments at once.
export async function POST(req: Request) {
  let body: { shipments?: ShipmentInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const shipments = Array.isArray(body?.shipments) ? body.shipments : [];
  if (shipments.length === 0) {
    return NextResponse.json({ error: "No shipments provided" }, { status: 400 });
  }
  if (shipments.length > 1000) {
    return NextResponse.json({ error: "Max 1000 rows per batch" }, { status: 413 });
  }

  const results = shipments.map((s, i) => {
    try {
      const result = runCheck(s);
      return { row: i + 1, ok: true as const, result };
    } catch (e) {
      return { row: i + 1, ok: false as const, error: e instanceof Error ? e.message : "check failed" };
    }
  });

  return NextResponse.json({ count: results.length, results });
}

export const dynamic = "force-dynamic";
