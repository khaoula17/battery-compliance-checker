import { NextResponse } from "next/server";
import { aiProvider, extractFromDocument } from "@/lib/ai/sds";

// POST /api/ai/sds  (multipart/form-data, field "file")
// Reads an SDS / spec sheet (PDF or image) and returns structured fields to
// pre-fill the checker. Requires ANTHROPIC_API_KEY or OPENAI_API_KEY.
export async function POST(req: Request) {
  if (!aiProvider()) {
    return NextResponse.json(
      {
        status: "not_configured",
        message: "Set GEMINI_API_KEY (free, reads PDFs) or ANTHROPIC_API_KEY, or OPENAI_API_KEY (images only), to enable the AI reader.",
      },
      { status: 501 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a 'file' field." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file'." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString("base64");
  const mediaType = file.type || "application/pdf";

  try {
    const extraction = await extractFromDocument(base64, mediaType);
    return NextResponse.json({ status: "ok", extraction });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 502 }
    );
  }
}

export const dynamic = "force-dynamic";
