import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API for developers — embed lithium battery compliance checks",
  description:
    "ClearToShip REST API. Freight forwarders and 3PLs can check lithium-battery shipments programmatically. Auth, endpoints, request/response, and examples.",
};

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">ClearToShip API</h1>
      <p className="mt-3 text-slate-600">
        Check lithium-battery shipments from your own systems. Built for freight
        forwarders and 3PLs processing many shipments — one integration, thousands of
        checks. Generate a key in your <a href="/dashboard" className="text-brand underline">dashboard</a>.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Authentication</h2>
      <p className="mt-1 text-sm text-slate-600">
        Pass your API key as a Bearer token. Keep it server-side — never expose it in a browser.
      </p>
      <Code>{`Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxx`}</Code>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Check shipments</h2>
      <p className="mt-1 text-sm text-slate-600">
        <span className="font-mono text-slate-800">POST /api/v1/labels</span> — send one shipment or a batch, get a classified result per shipment.
      </p>

      <h3 className="mt-4 text-sm font-semibold text-slate-700">Request</h3>
      <Code>{`curl -X POST https://YOUR_DOMAIN/api/v1/labels \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "shipments": [
      {
        "chemistry": "ion",
        "configuration": "standalone",
        "itemType": "battery",
        "whPerUnit": 98,
        "stateOfChargePct": 25,
        "operator": "FEDEX",
        "aircraft": "cargo",
        "un38_3TestSummaryAvailable": true
      }
    ]
  }'`}</Code>

      <h3 className="mt-4 text-sm font-semibold text-slate-700">Response</h3>
      <Code>{`{
  "count": 1,
  "results": [
    {
      "classification": {
        "unNumber": "UN3480",
        "packingInstruction": "965",
        "section": "IB",
        "dgdRequired": true,
        "requiredMarks": ["Lithium battery mark"],
        "requiredLabels": ["Class 9 lithium battery hazard label", "Cargo Aircraft Only label"]
      },
      "passed": true,
      "findings": [
        { "code": "CARGO_AIRCRAFT_ONLY", "severity": "warning", "message": "..." }
      ],
      "rulesetVersion": "2026.3"
    }
  ]
}`}</Code>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Input fields</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
        <li><span className="font-mono">chemistry</span>: "ion" | "metal" | "sodium"</li>
        <li><span className="font-mono">configuration</span>: "standalone" | "packed_with_equipment" | "contained_in_equipment"</li>
        <li><span className="font-mono">itemType</span>: "cell" | "battery"</li>
        <li><span className="font-mono">whPerUnit</span> (lithium-ion) / <span className="font-mono">lithiumContentG</span> (lithium-metal)</li>
        <li><span className="font-mono">stateOfChargePct</span>, <span className="font-mono">numUnits</span>, <span className="font-mono">netWeightKg</span> (optional)</li>
        <li><span className="font-mono">operator</span>: "GENERIC" | "FEDEX" | "UPS" | "DHL"</li>
        <li><span className="font-mono">aircraft</span>: "cargo" | "passenger" | "unspecified"</li>
        <li><span className="font-mono">condition</span>: "normal" | "damaged_defective" | "recalled" | "waste" | "prototype"</li>
        <li><span className="font-mono">un38_3TestSummaryAvailable</span>: boolean</li>
      </ul>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Ruleset version</h2>
      <p className="mt-1 text-sm text-slate-600">
        <span className="font-mono text-slate-800">GET /api/reg-version</span> returns the active ruleset version, so you can detect updates and alert your users.
      </p>

      <p className="mt-10 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
        Results are a pre-check. A trained, certified shipper is responsible for the final
        dangerous-goods declaration. Verify against the current IATA DGR / 49 CFR.
      </p>

      <div className="mt-8">
        <a href="/dashboard" className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Get an API key →
        </a>
      </div>
    </div>
  );
}
