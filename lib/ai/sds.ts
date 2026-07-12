// AI SDS / spec-sheet extraction. Provider-agnostic: uses Anthropic if
// ANTHROPIC_API_KEY is set (supports PDF + images natively), else OpenAI for
// images. Pure fetch — no SDK dependency.

export interface SdsExtraction {
  chemistry: "ion" | "metal" | null;
  itemType: "cell" | "battery" | null;
  whPerUnit: number | null;
  lithiumContentG: number | null;
  unNumber: string | null;
  netWeightKg: number | null;
  confidence: number; // 0..1
  raw?: string;
}

const SYSTEM = `You extract lithium-battery shipping data from a Safety Data Sheet (SDS) or battery spec sheet.
Return ONLY a JSON object with these keys (use null when unknown):
{
  "chemistry": "ion" | "metal" | null,        // lithium-ion vs lithium-metal
  "itemType": "cell" | "battery" | null,
  "whPerUnit": number | null,                   // watt-hours per cell/battery (lithium-ion)
  "lithiumContentG": number | null,             // grams lithium per unit (lithium-metal)
  "unNumber": "UN3480" | "UN3481" | "UN3090" | "UN3091" | null,
  "netWeightKg": number | null,
  "confidence": number                          // 0..1 overall confidence
}
Do not include any prose, explanation, or markdown — only the JSON object.`;

export function aiProvider(): "anthropic" | "gemini" | "openai" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini"; // free tier, reads PDF + images
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function parseJson(textRaw: string): SdsExtraction {
  const text = textRaw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? text.slice(start, end + 1) : text;
  const obj = JSON.parse(slice);
  return {
    chemistry: obj.chemistry ?? null,
    itemType: obj.itemType ?? null,
    whPerUnit: numOrNull(obj.whPerUnit),
    lithiumContentG: numOrNull(obj.lithiumContentG),
    unNumber: obj.unNumber ?? null,
    netWeightKg: numOrNull(obj.netWeightKg),
    confidence: typeof obj.confidence === "number" ? obj.confidence : 0.5,
    raw: textRaw,
  };
}

function numOrNull(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

export async function extractFromDocument(
  base64: string,
  mediaType: string
): Promise<SdsExtraction> {
  const provider = aiProvider();
  if (!provider) throw new Error("No AI provider configured");

  if (provider === "anthropic") {
    const isPdf = mediaType === "application/pdf";
    const block = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [
          { role: "user", content: [block, { type: "text", text: "Extract the fields as specified." }] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const textOut = data?.content?.[0]?.text ?? "";
    return parseJson(textOut);
  }

  if (provider === "gemini") {
    // Google Gemini (free tier). Reads PDFs AND images via inline_data.
    const model = process.env.AI_MODEL || "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType, data: base64 } },
                { text: `${SYSTEM}\n\nExtract the fields as specified. Return only the JSON object.` },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parseJson(textOut);
  }

  // OpenAI (images only — for PDFs prefer Anthropic or Gemini).
  if (mediaType === "application/pdf") {
    throw new Error("PDF extraction needs ANTHROPIC_API_KEY or GEMINI_API_KEY (OpenAI path supports images only).");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the fields as specified." },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
          ],
        },
      ],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return parseJson(data?.choices?.[0]?.message?.content ?? "");
}
