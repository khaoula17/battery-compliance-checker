import { NextResponse } from "next/server";
import { getProfile, listApiKeys, createApiKey, revokeApiKey } from "@/lib/db";

// Manage the current user's API keys (for the forwarder REST API).
async function requireUser() {
  const profile = await getProfile();
  return profile?.id ?? null;
}

export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json({ keys: await listApiKeys(userId) });
}

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const created = await createApiKey(userId, (body?.label as string) || "API key");
  if (!created) return NextResponse.json({ error: "Could not create key." }, { status: 500 });
  // The raw key is shown only once.
  return NextResponse.json({ key: created.raw });
}

export async function DELETE(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await revokeApiKey(userId, id);
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
