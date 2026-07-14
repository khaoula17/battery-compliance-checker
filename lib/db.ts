// Database helpers over Supabase. All functions degrade gracefully (return
// safe defaults) when Supabase isn't configured, so the app builds and the
// anonymous checker works without a database.

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { CheckResult, ShipmentInput } from "@/lib/compliance/types";
import type { Plan } from "@/lib/plans";
import { sendEmail, isEmailConfigured } from "@/lib/email";

// Fire welcome + founder-notification emails on first signup. Never throws
// (email is best-effort and must not break login). No-op until Resend is set.
async function onNewSignup(email: string | null): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    if (email) {
      await sendEmail({
        to: email,
        subject: "Welcome to ClearToShip",
        html:
          "<p>Welcome to ClearToShip 👋</p>" +
          "<p>You can now save your lithium-battery compliance checks and download PDFs. " +
          'Start a check any time at <a href="https://cleartoship.com/check">/check</a>.</p>' +
          "<p>Reply to this email if you need anything — we read every message.</p>",
      });
    }
    const notify = (process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAILS || "")
      .split(",")[0]
      .trim();
    if (notify) {
      await sendEmail({
        to: notify,
        subject: "🎉 New ClearToShip signup",
        html: `<p>New signup: <strong>${email ?? "unknown"}</strong></p>`,
      });
    }
  } catch {
    // best-effort only
  }
}

export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
}

export interface SavedCheck {
  id: string;
  input: ShipmentInput;
  result: CheckResult;
  operator: string | null;
  passed: boolean;
  created_at: string;
}

export interface Domain {
  slug: string;
  display_name: string;
  brand_color: string | null;
  custom_domain: string | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, plan, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (data) return data as Profile;

  // First login — create a free profile + send welcome/notification emails.
  const fresh = { id: user.id, email: user.email ?? null, plan: "free" as Plan, stripe_customer_id: null };
  await supabase.from("profiles").insert(fresh);
  await onNewSignup(fresh.email);
  return fresh;
}

export async function countChecksThisMonth(userId: string): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("checks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());
  return count ?? 0;
}

export async function saveCheck(
  userId: string,
  input: ShipmentInput,
  result: CheckResult
): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("checks").insert({
    user_id: userId,
    input,
    result,
    ruleset_version: result.rulesetVersion,
    operator: input.operator ?? null,
    passed: result.passed,
  });
}

export async function listChecks(userId: string, limit = 50): Promise<SavedCheck[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("checks")
    .select("id, input, result, operator, passed, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as SavedCheck[]) ?? [];
}

export async function getDomain(slug: string): Promise<Domain | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("domains")
    .select("slug, display_name, brand_color, custom_domain")
    .eq("slug", slug)
    .single();
  return (data as Domain) ?? null;
}

// --- Webhook-side (service role) ---

export async function setPlanByStripeCustomer(customerId: string, plan: Plan): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("profiles").update({ plan }).eq("stripe_customer_id", customerId);
}

export async function linkStripeCustomer(userId: string, customerId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
}

// --- Newsletter / lead capture ---

export async function addSubscriber(email: string, source: string): Promise<{ ok: boolean; stored: boolean }> {
  const admin = createAdminClient();
  if (!admin) return { ok: true, stored: false }; // graceful when DB not configured
  // Upsert-ish: ignore duplicates (unique email).
  const { error } = await admin.from("subscribers").insert({ email, source });
  if (error && !/(duplicate|unique)/i.test(error.message)) {
    return { ok: false, stored: false };
  }
  return { ok: true, stored: true };
}

// --- API keys (REST) ---

import { createHash, randomBytes } from "crypto";

export interface ApiKeyRow {
  id: string;
  label: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Create a key: returns the raw value ONCE (only the hash is stored).
export async function createApiKey(userId: string, label: string): Promise<{ raw: string } | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const raw = "sk_live_" + randomBytes(24).toString("hex");
  const { error } = await supabase
    .from("api_keys")
    .insert({ user_id: userId, key_hash: hashApiKey(raw), label: label || "API key" });
  if (error) return null;
  return { raw };
}

export async function listApiKeys(userId: string): Promise<ApiKeyRow[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("api_keys")
    .select("id, label, last_used_at, usage_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as ApiKeyRow[]) ?? [];
}

export async function revokeApiKey(userId: string, id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  await supabase.from("api_keys").delete().eq("user_id", userId).eq("id", id);
}

export async function findApiKeyOwner(rawKey: string): Promise<{ userId: string; plan: Plan } | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const hash = hashApiKey(rawKey);
  const { data } = await admin
    .from("api_keys")
    .select("user_id, usage_count, profiles(plan)")
    .eq("key_hash", hash)
    .single();
  if (!data) return null;
  const plan = (data as any).profiles?.plan ?? "free";
  await admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString(), usage_count: ((data as any).usage_count ?? 0) + 1 })
    .eq("key_hash", hash);
  return { userId: (data as any).user_id, plan };
}
