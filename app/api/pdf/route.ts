import { NextResponse } from "next/server";
import { runCheck, type ShipmentInput } from "@/lib/compliance";
import { generateDgdPdf, type DgdMeta } from "@/lib/pdf/dgd";
import { getProfile } from "@/lib/db";
import { canDownloadPdf, billingEnabled } from "@/lib/plans";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// POST /api/pdf  body: ShipmentInput & { meta?: DgdMeta }
// Returns a PDF. When auth is configured, gated to plans that include PDF.
export async function POST(req: Request) {
  let body: ShipmentInput & { meta?: DgdMeta };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Plan gating applies only once paid billing is live. Before launch, PDF is
  // open to everyone so the free experience is complete and never errors.
  if (billingEnabled() && isSupabaseConfigured()) {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Sign in to download PDFs." }, { status: 401 });
    if (!canDownloadPdf(profile.plan)) {
      return NextResponse.json(
        { error: "PDF download requires a paid plan." },
        { status: 402 }
      );
    }
  }

  try {
    const result = runCheck(body);
    const pdf = await generateDgdPdf(result, body.meta ?? {});
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="compliance-${result.classification.unNumber}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
