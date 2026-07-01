"use client";

import { useState } from "react";

async function post(url: string, body?: unknown): Promise<{ url?: string; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => ({ error: "Request failed" }));
}

export function UpgradeButton({
  plan,
  annual = false,
  children,
  className,
}: {
  plan: "payg" | "pro" | "whitelabel";
  annual?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setErr(null);
    const data = await post("/api/stripe/checkout", { plan, annual });
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else setErr(data.error || "Could not start checkout");
  }

  return (
    <>
      <button onClick={go} disabled={loading} className={className}>
        {loading ? "…" : children}
      </button>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </>
  );
}

export function ManageBillingButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const data = await post("/api/stripe/portal");
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }
  return (
    <button onClick={go} disabled={loading} className={className}>
      {loading ? "…" : "Manage billing"}
    </button>
  );
}
