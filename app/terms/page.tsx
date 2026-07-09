import type { Metadata } from "next";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for ClearToShip.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      {LEGAL.company.includes("[") && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 not-prose">
          Setup note (only you see this until configured): fill your company name,
          email, and jurisdiction via the <code>NEXT_PUBLIC_COMPANY_NAME</code>,
          <code>NEXT_PUBLIC_CONTACT_EMAIL</code>, <code>NEXT_PUBLIC_JURISDICTION</code>{" "}
          env vars, and have a lawyer review before charging. This banner disappears
          once the company name is set.
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900 mt-6">Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: {LEGAL.lastUpdated}</p>

      <Section n="1" title="Agreement">
        These Terms of Service (“Terms”) govern your use of {LEGAL.product} (the
        “Service”), operated by {LEGAL.company} (“we”, “us”). By accessing or using
        the Service you agree to these Terms. If you do not agree, do not use the
        Service.
      </Section>

      <Section n="2" title="What the Service is — and is not">
        The Service is a <strong>pre-flight, decision-support tool</strong> that
        helps classify lithium-battery shipments and flag potential issues against
        publicly available regulatory requirements. It is <strong>not legal advice,
        not a certification, and not a substitute</strong> for the current IATA
        Dangerous Goods Regulations, ICAO Technical Instructions, 49 CFR, or any
        carrier or State requirement. It does <strong>not</strong> guarantee
        regulatory compliance or that any shipment will be accepted or free from
        penalties.
      </Section>

      <Section n="3" title="Your responsibilities">
        Dangerous-goods air shipments must be prepared, verified, and signed by a
        person with valid, current dangerous-goods training. You are solely
        responsible for: (a) verifying every result against the applicable current
        regulations and your carrier’s rules; (b) the accuracy of the data you
        enter; and (c) the final dangerous-goods declaration and shipment. You must
        not rely on the Service as your sole basis for shipping.
      </Section>

      <Section n="4" title="No warranty">
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE”, WITHOUT WARRANTIES OF
        ANY KIND, EXPRESS OR IMPLIED, INCLUDING ACCURACY, FITNESS FOR A PARTICULAR
        PURPOSE, OR NON-INFRINGEMENT. We do not warrant that the Service is complete,
        current, error-free, or that outputs are correct or sufficient for
        compliance.
      </Section>

      <Section n="5" title="Limitation of liability">
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL.company.toUpperCase()} WILL
        NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
        PUNITIVE DAMAGES, OR FOR ANY FINES, PENALTIES, SHIPMENT REJECTIONS, LOST
        PROFITS, OR LOSS OF DATA, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL
        AGGREGATE LIABILITY FOR ANY CLAIM IS LIMITED TO THE GREATER OF (a) THE FEES
        YOU PAID US IN THE 3 MONTHS BEFORE THE CLAIM, OR (b) USD $100.
      </Section>

      <Section n="6" title="Indemnification">
        You agree to indemnify and hold harmless {LEGAL.company} from any claims,
        damages, or costs (including reasonable legal fees) arising from your use of
        the Service, your shipments, or your breach of these Terms.
      </Section>

      <Section n="7" title="Accounts & acceptable use">
        You are responsible for activity under your account. Do not misuse the
        Service, attempt to disrupt it, scrape it, or use it to violate any law or
        regulation.
      </Section>

      <Section n="8" title="Payment">
        Paid plans (where offered) are billed via our payment processor. Fees are
        described at checkout. Except where required by law, fees are non-refundable.
      </Section>

      <Section n="9" title="Intellectual property">
        We retain all rights in the Service and its content. Regulatory text
        referenced by the Service belongs to its respective owners; the Service does
        not grant you rights to any third-party regulatory publication.
      </Section>

      <Section n="10" title="Changes & termination">
        We may modify or discontinue the Service or these Terms at any time. Continued
        use after changes means you accept the updated Terms. We may suspend accounts
        that violate these Terms.
      </Section>

      <Section n="11" title="Governing law">
        These Terms are governed by the laws of {LEGAL.jurisdiction}, without regard
        to conflict-of-laws rules.
      </Section>

      <Section n="12" title="Contact">
        Questions: {LEGAL.contactEmail}.
      </Section>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-900">{n}. {title}</h2>
      <p className="mt-1 text-sm text-slate-700 leading-relaxed">{children}</p>
    </div>
  );
}
