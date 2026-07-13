"use client";

import { useState } from "react";
import type { CheckResult, ShipmentInput } from "@/lib/compliance/types";
import { RequiredMarks } from "@/components/MarkIcons";

const sectionBadge: Record<string, string> = {
  II: "bg-emerald-100 text-emerald-800",
  IB: "bg-amber-100 text-amber-800",
  IA: "bg-red-100 text-red-800",
  I: "bg-red-100 text-red-800",
  UNKNOWN: "bg-slate-100 text-slate-700",
};

const severityStyle: Record<string, string> = {
  error: "border-red-300 bg-red-50 text-red-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
};

export default function CheckPage() {
  const [form, setForm] = useState<ShipmentInput>({
    chemistry: "ion",
    configuration: "standalone",
    itemType: "battery",
    whPerUnit: 50,
    stateOfChargePct: 25,
    un38_3TestSummaryAvailable: true,
    whMarkedOnCase: true,
    exceedsSectionIIQuantity: false,
    operator: "GENERIC",
    condition: "normal",
    aircraft: "unspecified",
  });
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [meta, setMeta] = useState({ shipperName: "", consigneeName: "", reference: "" });

  function set<K extends keyof ShipmentInput>(key: K, value: ShipmentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function runWith(payload: ShipmentInput) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setResult(data as CheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await runWith(form);
  }

  // Instant demo: fill a realistic shipment and run it, so first-time visitors
  // see a full result without typing anything.
  function runExample() {
    const sample: ShipmentInput = {
      chemistry: "ion",
      configuration: "standalone",
      itemType: "battery",
      whPerUnit: 98,
      stateOfChargePct: 60, // over 30% → will show a blocking error
      un38_3TestSummaryAvailable: true,
      whMarkedOnCase: true,
      exceedsSectionIIQuantity: false,
      operator: "FEDEX",
      aircraft: "passenger", // standalone is CAO → will flag
      condition: "normal",
    };
    setForm(sample);
    void runWith(sample);
  }

  async function uploadSds(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ai/sds", { method: "POST", body: fd });
      const data = await res.json();
      if (res.status === 501) {
        setUploadMsg("AI reader not enabled on this deployment (needs an API key). Enter values manually.");
        return;
      }
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      const x = data.extraction;
      setForm((f) => ({
        ...f,
        chemistry: x.chemistry ?? f.chemistry,
        itemType: x.itemType ?? f.itemType,
        whPerUnit: x.whPerUnit ?? f.whPerUnit,
        lithiumContentG: x.lithiumContentG ?? f.lithiumContentG,
      }));
      setUploadMsg(`Pre-filled from document (confidence ${(Number(x.confidence) * 100).toFixed(0)}%). Review before checking.`);
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setUploading(false);
    }
  }

  async function downloadPdf() {
    if (!result) return;
    const res = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, meta }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "PDF download failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compliance-${result.classification.unNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const isIon = form.chemistry === "ion";
  const isMetal = form.chemistry === "metal";
  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED === "true";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Pre-flight check</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your shipment details for an instant IATA classification, required
        marks &amp; labels, and a clear pass/fail with fixes.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-brand">
          ✓ Checked against IATA DGR 67th edition (2026) — every result cited
        </span>
        <button
          type="button"
          onClick={runExample}
          className="text-xs font-medium text-brand underline hover:text-brand-dark"
        >
          ▶ Try an example
        </button>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Form */}
        <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          {aiEnabled && (
            <div className="rounded-md border border-dashed border-brand/40 bg-teal-50/50 p-3">
              <label className="block text-sm font-medium text-slate-700">
                ✨ Auto-fill from a datasheet / SDS (PDF or image)
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={uploadSds}
                disabled={uploading}
                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white"
              />
              {uploading && <p className="mt-1 text-xs text-slate-500">Reading document…</p>}
              {uploadMsg && <p className="mt-1 text-xs text-slate-600">{uploadMsg}</p>}
            </div>
          )}

          <Field label="Chemistry">
            <select className="input" value={form.chemistry}
              onChange={(e) => set("chemistry", e.target.value as ShipmentInput["chemistry"])}>
              <option value="ion">Lithium-ion</option>
              <option value="metal">Lithium-metal</option>
              <option value="sodium">Sodium-ion</option>
            </select>
          </Field>

          <Field label="Configuration">
            <select className="input" value={form.configuration}
              onChange={(e) => set("configuration", e.target.value as ShipmentInput["configuration"])}>
              <option value="standalone">Standalone (shipped alone)</option>
              <option value="packed_with_equipment">Packed with equipment</option>
              <option value="contained_in_equipment">Contained in equipment</option>
            </select>
          </Field>

          <Field label="Item type">
            <select className="input" value={form.itemType}
              onChange={(e) => set("itemType", e.target.value as ShipmentInput["itemType"])}>
              <option value="battery">Battery</option>
              <option value="cell">Cell</option>
            </select>
          </Field>

          {isMetal ? (
            <Field label="Lithium content per unit (g)">
              <input className="input" type="number" step="0.1" value={form.lithiumContentG ?? ""}
                onChange={(e) => set("lithiumContentG", e.target.value === "" ? undefined : Number(e.target.value))} />
            </Field>
          ) : (
            <Field label={isIon ? "Watt-hours per unit (Wh)" : "Watt-hours per unit (Wh) — optional"}>
              <input className="input" type="number" step="0.1" value={form.whPerUnit ?? ""}
                onChange={(e) => set("whPerUnit", e.target.value === "" ? undefined : Number(e.target.value))} />
            </Field>
          )}

          {isIon && (
            <Field label="State of charge (%)">
              <input className="input" type="number" value={form.stateOfChargePct ?? ""}
                onChange={(e) => set("stateOfChargePct", e.target.value === "" ? undefined : Number(e.target.value))} />
            </Field>
          )}

          <Field label="Carrier">
            <select className="input" value={form.operator}
              onChange={(e) => set("operator", e.target.value as ShipmentInput["operator"])}>
              <option value="GENERIC">Generic (base IATA)</option>
              <option value="FEDEX">FedEx</option>
              <option value="UPS">UPS</option>
              <option value="DHL">DHL</option>
            </select>
          </Field>

          <Field label="Aircraft">
            <select className="input" value={form.aircraft}
              onChange={(e) => set("aircraft", e.target.value as ShipmentInput["aircraft"])}>
              <option value="unspecified">Not sure yet</option>
              <option value="cargo">Cargo aircraft (CAO)</option>
              <option value="passenger">Passenger aircraft</option>
            </select>
          </Field>

          <Field label="Condition">
            <select className="input" value={form.condition}
              onChange={(e) => set("condition", e.target.value as ShipmentInput["condition"])}>
              <option value="normal">Normal / new</option>
              <option value="damaged_defective">Damaged or defective</option>
              <option value="recalled">Recalled</option>
              <option value="waste">Waste / for disposal or recycling</option>
              <option value="prototype">Prototype / low production run</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.un38_3TestSummaryAvailable}
              onChange={(e) => set("un38_3TestSummaryAvailable", e.target.checked)} />
            UN 38.3 test summary available
          </label>
          {isIon && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!form.whMarkedOnCase}
                onChange={(e) => set("whMarkedOnCase", e.target.checked)} />
              Wh rating marked on case
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!form.exceedsSectionIIQuantity}
              onChange={(e) => set("exceedsSectionIIQuantity", e.target.checked)} />
            Package exceeds Section II quantity limit
          </label>

          <details className="rounded-md border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Shipper / consignee for the PDF (optional)
            </summary>
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Shipper name" value={meta.shipperName}
                onChange={(e) => setMeta((m) => ({ ...m, shipperName: e.target.value }))} />
              <input className="input" placeholder="Consignee name" value={meta.consigneeName}
                onChange={(e) => setMeta((m) => ({ ...m, consigneeName: e.target.value }))} />
              <input className="input" placeholder="Reference / AWB" value={meta.reference}
                onChange={(e) => setMeta((m) => ({ ...m, reference: e.target.value }))} />
            </div>
          </details>

          <button type="submit" disabled={loading}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-white font-medium hover:bg-brand-dark disabled:opacity-60">
            {loading ? "Checking…" : "Run check"}
          </button>
        </form>

        {/* Result */}
        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>
          )}

          {!result && !error && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Results appear here.
            </div>
          )}

          {result && (
            <>
              <div className={`rounded-lg border p-4 ${result.passed ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {result.passed ? "✅ No blocking issues" : "⛔ Not ready to ship"}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${sectionBadge[result.classification.section]}`}>
                    Section {result.classification.section}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
                <h3 className="font-semibold text-slate-900 mb-2">Classification</h3>
                <dl className="grid grid-cols-2 gap-y-1">
                  <dt className="text-slate-500">UN number</dt><dd>{result.classification.unNumber}</dd>
                  <dt className="text-slate-500">Proper shipping name</dt><dd>{result.classification.properShippingName}</dd>
                  <dt className="text-slate-500">Packing instruction</dt><dd>PI {result.classification.packingInstruction}</dd>
                  <dt className="text-slate-500">Shipper&apos;s Declaration</dt><dd>{result.classification.dgdRequired ? "Required" : "Not required"}</dd>
                  <dt className="text-slate-500">Marks</dt><dd>{result.classification.requiredMarks.join(", ") || "—"}</dd>
                  <dt className="text-slate-500">Labels</dt><dd>{result.classification.requiredLabels.join(", ") || "—"}</dd>
                </dl>
              </div>

              {(result.classification.requiredMarks.length > 0 || result.classification.requiredLabels.length > 0) && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Required on the package</h3>
                  <RequiredMarks marks={result.classification.requiredMarks} labels={result.classification.requiredLabels} />
                  <p className="mt-3 text-xs text-slate-400">Illustrative — apply the correct compliant printed marks/labels per the DGR.</p>
                </div>
              )}

              {result.findings.length > 0 && (
                <div className="space-y-2">
                  {result.findings.map((f, i) => (
                    <div key={i} className={`rounded-md border p-3 text-sm ${severityStyle[f.severity]}`}>
                      <div className="font-medium uppercase text-xs tracking-wide">{f.severity}</div>
                      <div className="mt-0.5">{f.message}</div>
                      {f.fix && <div className="mt-1 text-xs">Fix: {f.fix}</div>}
                      {f.citation && (
                        <a href={f.citation.url} target="_blank" rel="noreferrer"
                          className="mt-1 inline-block text-xs underline opacity-80">
                          {f.citation.ref}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={downloadPdf}
                className="w-full rounded-md border border-brand px-4 py-2.5 text-sm font-medium text-brand hover:bg-teal-50"
              >
                ⬇ Download compliance PDF
              </button>

              <p className="text-xs text-slate-400">
                Ruleset {result.rulesetVersion} · {result.rulesetEdition} · generated {new Date(result.generatedAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.375rem;
          padding: 0.5rem 0.625rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #0f766e;
          box-shadow: 0 0 0 1px #0f766e;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
