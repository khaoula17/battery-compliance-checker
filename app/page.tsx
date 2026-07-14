import { Pricing } from "@/components/Pricing";
import { TESTIMONIALS } from "@/lib/testimonials";
import { NewsletterSignup } from "@/components/NewsletterSignup";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <span className="inline-block rounded-full border border-brand/30 bg-white px-3 py-1 text-xs font-medium text-brand">
            Checks against IATA DGR 67th edition (2026)
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
            Ship lithium batteries by air <span className="text-brand">without rejections</span>.
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
            Paste your shipment or upload a datasheet. In seconds you get the UN number,
            packing instruction, required marks &amp; labels, carrier-specific rules, and a
            clear pass/fail with the exact fixes — before the carrier hands it back.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a href="/check" className="rounded-md bg-brand px-6 py-3 text-white font-semibold hover:bg-brand-dark shadow-sm">
              Run a free check →
            </a>
            <a href="#how" className="rounded-md border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:border-slate-400">
              See how it works
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-500">Free to try · No signup · No credit card</p>
        </div>
      </section>

      {/* Stakes */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 grid gap-6 sm:grid-cols-3 text-center">
          <Stat big="$102,348" small="Max US hazmat civil penalty, per violation (up to $238,809 if it causes injury)." />
          <Stat big="Rejected at tender" small="A wrong declaration gets your shipment refused — lost time and re-booking costs." />
          <Stat big="Seconds, not hours" small="Skip manual DGR lookups. Get a defensible classification instantly." />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <Step n="1" t="Enter or upload" d="Type the battery details, or upload a datasheet/SDS and let the AI reader fill it in." />
          <Step n="2" t="Instant classification" d="Section II / IB / IA / I, PI 965–970, UN number, marks, labels, and carrier (FedEx/UPS/DHL) rules." />
          <Step n="3" t="Fix & export" d="Plain-English findings with the exact fix and the regulatory reference. Download a PDF summary." />
        </div>
        <div className="mt-10 text-center">
          <a href="/check" className="rounded-md bg-brand px-6 py-3 text-white font-semibold hover:bg-brand-dark">
            Try it now — free
          </a>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-16 grid gap-6 sm:grid-cols-3">
          <Card t="Lithium-first, not bolted-on" d="Built only for lithium batteries — watt-hour and lithium-content logic done right (no bogus 'Q-value')." />
          <Card t="Carrier & aircraft rules built in" d="Standalone lithium is Cargo Aircraft Only and needs carrier approval; batteries with equipment jump to full regulation once over the limits. We flag it before you ship." />
          <Card t="Every result is cited" d="Each finding links to the IATA DGR / 49 CFR reference, so you (and your auditor) can trust it." />
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">Built for the people who actually ship</h2>
        <p className="mt-2 text-center text-sm text-slate-500">A fast pre-check for trained shippers — not a replacement for DG training or the carrier&apos;s system.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Card t="Freight forwarders & 3PLs" d="Process more lithium shipments per hour. White-label it for your own shippers." />
          <Card t="Frequent business shippers" d="Stuck between free carrier wizards and $3k–$10k enterprise suites? This is the middle." />
          <Card t="DG / compliance teams" d="A quick second check before the declaration is signed and tendered." />
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Why not just…?</h2>
          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr><th className="px-4 py-2 font-medium">Option</th><th className="px-4 py-2 font-medium">The catch</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-4 py-2 font-medium">DIY templates</td><td className="px-4 py-2 text-slate-600">Error-prone, no validation, no carrier rules.</td></tr>
                <tr><td className="px-4 py-2 font-medium">Enterprise suites</td><td className="px-4 py-2 text-slate-600">$3k–$10k+, sales-led, overkill for lithium-only needs.</td></tr>
                <tr><td className="px-4 py-2 font-medium">Carrier portals</td><td className="px-4 py-2 text-slate-600">Free, but you only find errors at the end. We catch them first.</td></tr>
                <tr><td className="px-4 py-2 font-semibold text-brand">This tool</td><td className="px-4 py-2 text-slate-700">Cheap, instant, lithium-focused pre-check with fixes and citations.</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-sm">
            <a href="/compare" className="text-brand font-medium hover:underline">See the full comparison →</a>
          </p>
        </div>
      </section>

      {/* Testimonials — renders only when TESTIMONIALS has real entries */}
      {TESTIMONIALS.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Trusted by shippers who feel the pain</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <figure key={i} className="rounded-lg border border-slate-200 bg-white p-5">
                <blockquote className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{t.name}</span> — {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      <Pricing />

      {/* FAQ */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Questions, answered honestly</h2>
          <div className="mt-8 space-y-3">
            <Faq q="Does this guarantee I won't be fined?" a="No — and be wary of any tool that claims it does. We catch the common, costly mistakes (wrong section, missing UN 38.3 summary, over-charge, carrier bans) and cite the rule for each. A trained, certified shipper is still responsible for the final, signed declaration." />
            <Faq q="Do I still need DG training?" a="Yes. Air dangerous-goods declarations must be signed by someone with current IATA DG training (renewed every 24 months). This tool is a fast pre-check for trained shippers — it doesn't replace training or certification." />
            <Faq q="Will the carrier accept the output?" a="Treat the PDF as a pre-flight summary for your review, then file the actual declaration in your carrier's accepted system (FedEx Ship Manager, UPS WorldShip, MyDHL+) or an approved vendor. We tell you what's required so the carrier step goes smoothly." />
            <Faq q="Which rules does it cover?" a="Lithium-ion and lithium-metal by air: PI 965–970, Section II/IB/IA/I, watt-hour and lithium-content thresholds, the 30% state-of-charge rule for UN3480, UN 38.3 test summary, marks/labels, and FedEx/UPS/DHL variations. EU and full quantity tables are on the roadmap." />
            <Faq q="Is my data stored?" a="Anonymous checks aren't stored. If you create an account, your checks are saved to your dashboard so you can reuse them." />
          </div>
        </div>
      </section>

      {/* Newsletter capture */}
      <section className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Stay current — automatically</h2>
          <p className="mt-2 text-sm text-slate-600">
            IATA and 49 CFR change every year. Get a plain-English heads-up the moment a
            lithium-battery rule changes — free.
          </p>
          <div className="mx-auto mt-5 max-w-md text-left">
            <NewsletterSignup source="landing" title="" subtitle="" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Check your next shipment in 30 seconds.</h2>
          <p className="mt-3 text-teal-50">Free to try. No signup. No credit card.</p>
          <a href="/check" className="mt-6 inline-block rounded-md bg-white px-6 py-3 font-semibold text-brand hover:bg-teal-50">
            Run a free check →
          </a>
        </div>
      </section>
    </div>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-slate-900">{big}</div>
      <p className="mt-1 text-sm text-slate-600">{small}</p>
    </div>
  );
}

function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{t}</h3>
      <p className="mt-1 text-sm text-slate-600">{d}</p>
    </div>
  );
}

function Card({ t, d }: { t: string; d: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">{t}</h3>
      <p className="mt-2 text-sm text-slate-600">{d}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer list-none font-medium text-slate-900 flex justify-between items-center">
        {q}
        <span className="text-slate-400 group-open:rotate-180 transition">⌄</span>
      </summary>
      <p className="mt-3 text-sm text-slate-600">{a}</p>
    </details>
  );
}
