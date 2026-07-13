import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClearToShip vs the alternatives — lithium battery shipping tools compared",
  description:
    "How ClearToShip compares to enterprise DG suites, legacy DGD generators, carrier portals, and DIY templates for shipping lithium batteries by air. Faster, lithium-first, AI-powered, always current.",
  keywords: [
    "lithium battery shipping software comparison",
    "dangerous goods software alternatives",
    "IATA DGR checker",
    "ShipHazmat alternative",
    "DGD generator",
  ],
};

const rows: { label: string; cts: string; enterprise: string; legacy: string; carrier: string; diy: string }[] = [
  { label: "Starting price", cts: "Free · $19/check · $39/mo", enterprise: "$3k–$10k+/yr", legacy: "Pay-per-doc", carrier: "Free (account)", diy: "Free" },
  { label: "Time to a result", cts: "~30 seconds", enterprise: "Setup + training", legacy: "Multi-step form", carrier: "At the end of booking", diy: "Manual lookup" },
  { label: "Lithium-battery specialized", cts: "✓ deep", enterprise: "General (all DG)", legacy: "General", carrier: "Generic", diy: "—" },
  { label: "AI datasheet reader (auto-fill)", cts: "✓", enterprise: "✗", legacy: "✗", carrier: "✗", diy: "✗" },
  { label: "Plain-English errors + fixes, cited", cts: "✓", enterprise: "Partial", legacy: "✗", carrier: "✗", diy: "✗" },
  { label: "Always current (public changelog)", cts: "✓ 2026 edition", enterprise: "✓", legacy: "Varies / can lag", carrier: "✓", diy: "✗" },
  { label: "Self-serve, no sales call", cts: "✓", enterprise: "✗", legacy: "✓", carrier: "✓", diy: "✓" },
  { label: "Batch check many shipments", cts: "✓", enterprise: "✓", legacy: "✗", carrier: "✗", diy: "✗" },
  { label: "Produces the carrier-filed declaration", cts: "Pre-check summary*", enterprise: "✓", legacy: "✓", carrier: "✓", diy: "✗" },
];

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">ClearToShip vs the alternatives</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Most tools for shipping lithium batteries by air are either heavy enterprise
        suites, older document generators, free-but-late carrier portals, or
        error-prone DIY templates. Here&apos;s an honest comparison of where ClearToShip
        fits.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-3 font-medium"></th>
              <th className="px-3 py-3 font-semibold text-brand">ClearToShip</th>
              <th className="px-3 py-3 font-medium">Enterprise DG suites</th>
              <th className="px-3 py-3 font-medium">Legacy DGD generators</th>
              <th className="px-3 py-3 font-medium">Carrier portals</th>
              <th className="px-3 py-3 font-medium">DIY templates</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="px-3 py-3 font-medium text-slate-700">{r.label}</td>
                <td className="px-3 py-3 bg-teal-50/40 text-slate-900">{r.cts}</td>
                <td className="px-3 py-3 text-slate-600">{r.enterprise}</td>
                <td className="px-3 py-3 text-slate-600">{r.legacy}</td>
                <td className="px-3 py-3 text-slate-600">{r.carrier}</td>
                <td className="px-3 py-3 text-slate-600">{r.diy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        *ClearToShip is a pre-flight check that produces a review summary — a trained,
        certified shipper files the final declaration in the carrier&apos;s accepted
        system. We&apos;re honest about that; it&apos;s why we&apos;re fast and cheap.
      </p>

      <section className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Where ClearToShip wins</h3>
          <p className="mt-2 text-sm text-slate-600">
            Speed, lithium-battery depth, an AI datasheet reader nobody else has, and
            plain-English fixes with the exact rule cited — kept current to the 2026 edition.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Where the big suites win</h3>
          <p className="mt-2 text-sm text-slate-600">
            They cover every DG class and mode and produce the carrier-filed document —
            but they&apos;re expensive, sales-led, and overkill if you just ship lithium by air.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Who ClearToShip is for</h3>
          <p className="mt-2 text-sm text-slate-600">
            Trained shippers, forwarders, and battery brands who want a fast, accurate,
            cited pre-check before the carrier — without a $5k contract.
          </p>
        </div>
      </section>

      <div className="mt-12 text-center">
        <a href="/check" className="rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">
          Run a free check →
        </a>
      </div>
    </div>
  );
}
