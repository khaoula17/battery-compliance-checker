"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!supabase) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-3 text-sm text-slate-600">
          Authentication isn&apos;t enabled on this deployment yet. The checker
          still works without an account at{" "}
          <a className="text-brand underline" href="/check">/check</a>.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          To enable: set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    );
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase!.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) setError(error.message);
      else setSent(true);
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (/fetch|network/i.test(msg)) {
        setError(
          "Couldn't reach the sign-in server. The Supabase URL is likely misconfigured — open /api/health to check (supabaseReachable should be true)."
        );
      } else {
        setError(msg);
      }
    }
  }

  async function google() {
    if (!agreed) return;
    await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Save your checks, download DGD PDFs, and manage billing.</p>

      {sent ? (
        <div className="mt-6 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
          Check your inbox — we sent a magic link to <strong>{email}</strong>.
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-brand underline">Terms of Service</a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-brand underline">Privacy Policy</a>,
              and understand this is a pre-check tool, not legal advice.
            </span>
          </label>
          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-white font-medium hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending…" : "Email me a magic link"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        onClick={google}
        disabled={!agreed}
        className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Continue with Google
      </button>
      {!agreed && (
        <p className="mt-2 text-center text-xs text-slate-400">Accept the terms above to continue.</p>
      )}
    </div>
  );
}
