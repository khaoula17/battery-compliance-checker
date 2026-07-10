// Lightweight transactional email via Resend's REST API (no SDK dependency).
// Env-gated: does nothing until RESEND_API_KEY is set. Use for onboarding,
// receipts, or "regulation updated" notices from server code.
//
// Setup: create a Resend account, verify a sending domain, set:
//   RESEND_API_KEY=re_...
//   EMAIL_FROM="ClearToShip <hello@yourdomain>"

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from || process.env.EMAIL_FROM || "ClearToShip <onboarding@resend.dev>",
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send failed" };
  }
}
