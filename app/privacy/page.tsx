import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for ClearToShip.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {LEGAL.company.includes("[") && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          Setup note (only you see this until configured): set your company info via
          env vars and have a lawyer review before charging. This banner disappears
          once the company name is set.
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900 mt-6">Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: {LEGAL.lastUpdated}</p>

      <Section n="1" title="Who we are">
        {LEGAL.product} is operated by {LEGAL.company}. Contact: {LEGAL.contactEmail}.
      </Section>

      <Section n="2" title="What we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Anonymous checks:</strong> if you use the checker without an account, your inputs are processed to return a result and are <strong>not stored</strong> to an account.</li>
          <li><strong>Account data:</strong> if you sign in, we store your email address and your saved checks (shipment inputs and results).</li>
          <li><strong>Payment data:</strong> handled by our payment processor (Stripe). We do not store card numbers.</li>
          <li><strong>Basic technical data:</strong> standard server/hosting logs.</li>
        </ul>
      </Section>

      <Section n="3" title="Why we use it">
        To provide the Service (run checks, save your history), manage your account
        and billing, respond to support, and improve the product.
      </Section>

      <Section n="4" title="Who we share it with (processors)">
        We use trusted service providers to run the Service: <strong>Supabase</strong>
        (authentication and database), <strong>Stripe</strong> (payments),
        <strong> Vercel</strong> (hosting), and, if you use the AI datasheet reader,
        the AI provider you enable. We do not sell your personal data.
      </Section>

      <Section n="5" title="Data retention & deletion">
        We keep account data while your account is active. You can request deletion
        of your account and associated data at any time by emailing {LEGAL.contactEmail}.
      </Section>

      <Section n="6" title="Your rights">
        Depending on your location, you may have rights to access, correct, export,
        or delete your personal data. Contact {LEGAL.contactEmail} to exercise them.
      </Section>

      <Section n="7" title="Security">
        We use industry-standard measures (encrypted transport, access controls,
        row-level security). No system is perfectly secure; use the Service at your
        own risk.
      </Section>

      <Section n="8" title="Changes">
        We may update this policy; material changes will be posted here with a new
        “last updated” date.
      </Section>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-900">{n}. {title}</h2>
      <div className="mt-1 text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
