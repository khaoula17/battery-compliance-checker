import { NextResponse } from "next/server";
import { addSubscriber } from "@/lib/db";

// POST /api/subscribe  body: { email, source? }
// Captures a lead/newsletter email from the free tool or landing.
export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  const res = await addSubscriber(email, body.source || "unknown");
  if (!res.ok) return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
