"use client";

import { useState } from "react";
import { UpgradeButton } from "@/components/billing";

// Pricing section with a monthly / annual toggle. PAYG is per-check (no annual).
export function Pricing() {
  const [annual, setAnnual] = useState(false);

  const tiers = [
    {
      name: "Pay-as-you-go",
      monthly: "$19",
      annual: "$19",
      unit: "/ check",
      note: "One check, with PDF download. No subscription.",
      cta: "Start",
      plan: "payg" as const,
      hasAnnual: false,
    },
    {
      name: "Pro",
      monthly: "$39",
      annual: "$390",
      unit: annual ? "/ yr" : "/ mo",
      note: "Unlimited checks, saved shipments, PDFs.",
      cta: "Choose Pro",
      plan: "pro" as const,
      highlight: true,
      hasAnnual: true,
    },
    {
      name: "3PL White-label",
      monthly: "$249",
      annual: "$2,490",
      unit: annual ? "/ yr" : "/ mo",
      note: "Your brand, many shippers, API access.",
      cta: "Choose White-label",
      plan: "whitelabel" as const,
      hasAnnual: true,
    },
  ];

  return (
    <section id="pricing" className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-center text-2xl font-bold text-slate-900">Simple, honest pricing</h2>
      <p className="text-center text-sm text-slate-500 mt-1">Start free. Upgrade when it saves you time.</p>

      <div className="mt-6 flex items-center justify-center gap-3 text-sm">
        <span className={!annual ? "font-semibold text-slate-900" : "text-slate-500"}>Monthly</span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative h-6 w-11 rounded-full bg-brand transition"
          aria-label="Toggle annual billing"
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${annual ? "left-[22px]" : "left-0.5"}`} />
        </button>
        <span className={annual ? "font-semibold text-slate-900" : "text-slate-500"}>
          Annual <span className="text-brand">· 2 months free</span>
        </span>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {tiers.map((t) => {
          const showAnnual = annual && t.hasAnnual;
          return (
            <div key={t.name} className={`rounded-xl border bg-white p-6 ${t.highlight ? "border-brand ring-2 ring-brand/20 shadow-sm" : "border-slate-200"}`}>
              {t.highlight && <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">Most popular</div>}
              <h3 className="font-semibold text-slate-900">{t.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">{showAnnual ? t.annual : t.monthly}</span>
                <span className="text-sm text-slate-500"> {t.unit}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{t.note}</p>
              <UpgradeButton
                plan={t.plan}
                annual={showAnnual}
                className={`mt-5 block w-full text-center rounded-md px-4 py-2.5 text-sm font-semibold ${t.highlight ? "bg-brand text-white hover:bg-brand-dark" : "border border-slate-300 text-slate-700 hover:border-slate-400"}`}
              >
                {t.cta}
              </UpgradeButton>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Free plan includes 5 checks per month.</p>
    </section>
  );
}
