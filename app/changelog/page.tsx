import type { Metadata } from "next";
import { rules } from "@/lib/compliance";
import { CHANGELOG } from "@/lib/compliance/changelog";

export const metadata: Metadata = {
  title: "Regulation updates & status",
  description:
    "How ClearToShip stays current with the IATA Dangerous Goods Regulations. Live ruleset version and a dated history of every update.",
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Status banner */}
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-emerald-800">Current &amp; monitored</span>
        </div>
        <p className="mt-2 text-sm text-emerald-900">
          Ruleset <strong>v{rules.version}</strong> — aligned to{" "}
          <strong>{rules.edition}</strong> (effective {rules.effectiveDate}). Last
          reviewed {rules.lastReviewed}. We monitor IATA, ICAO and 49 CFR for changes
          and update the ruleset when the rules change.
        </p>
      </div>

      <h1 className="mt-10 text-2xl font-bold text-slate-900">Regulation updates</h1>
      <p className="mt-1 text-sm text-slate-600">
        Every change to our compliance ruleset, dated and described — so you can see
        exactly how we keep you current.
      </p>

      <ol className="mt-8 space-y-8 border-l border-slate-200 pl-6">
        {CHANGELOG.map((e) => (
          <li key={e.version} className="relative">
            <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand" />
            <div className="flex items-baseline gap-3">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                v{e.version}
              </span>
              <span className="text-xs text-slate-500">{e.date}</span>
            </div>
            <h2 className="mt-2 font-semibold text-slate-900">{e.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {e.points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-xs text-slate-400">
        This history reflects changes to our simplified pre-check ruleset. Always
        verify against the current full IATA DGR / 49 CFR. Machine-readable version at{" "}
        <a href="/api/reg-version" className="underline">/api/reg-version</a>.
      </p>
    </div>
  );
}
