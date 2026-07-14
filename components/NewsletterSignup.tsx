"use client";

import { useState } from "react";

export function NewsletterSignup({
  source,
  title = "Get the free Lithium Shipping Brief",
  subtitle = "Rule changes, explained — the moment they happen. No spam, unsubscribe anytime.",
  compact = false,
}: {
  source: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setState("done");
    } else {
      setState("error");
      setMsg(data.error || "Something went wrong");
    }
  }

  if (state === "done") {
    return (
      <p className={`text-sm ${compact ? "text-slate-600" : "text-emerald-700 font-medium"}`}>
        ✓ You&apos;re in — we&apos;ll email you when the rules change.
      </p>
    );
  }

  return (
    <div>
      {!compact && (
        <>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </>
      )}
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {state === "loading" ? "…" : compact ? "Notify me" : "Subscribe"}
        </button>
      </form>
      {state === "error" && <p className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
