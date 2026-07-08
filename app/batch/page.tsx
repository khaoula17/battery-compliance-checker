"use client";

import { useState } from "react";
import type { CheckResult, ShipmentInput } from "@/lib/compliance/types";

type Row = { row: number; ok: boolean; result?: CheckResult; error?: string };

const HEADERS = [
  "chemistry",
  "configuration",
  "itemType",
  "whPerUnit",
  "lithiumContentG",
  "stateOfChargePct",
  "numUnits",
  "operator",
  "aircraft",
  "condition",
  "un38_3",
];

const TEMPLATE =
  HEADERS.join(",") +
  "\n" +
  "ion,standalone,battery,98,,25,,FEDEX,cargo,normal,true\n" +
  "ion,contained_in_equipment,battery,40,,,,DHL,passenger,normal,true\n" +
  "metal,standalone,battery,,1.5,,,GENERIC,cargo,normal,false\n";

function parseCsv(text: string): ShipmentInput[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const num = (v: string) => (v?.trim() ? Number(v) : undefined);

  return lines.slice(1).map((line) => {
    const c = line.split(",");
    const g = (name: string) => (idx(name) >= 0 ? (c[idx(name)] ?? "").trim() : "");
    const un38 = g("un38_3").toLowerCase();
    const input: ShipmentInput = {
      chemistry: (g("chemistry") || "ion") as ShipmentInput["chemistry"],
      configuration: (g("configuration") || "standalone") as ShipmentInput["configuration"],
      itemType: (g("itemType") || "battery") as ShipmentInput["itemType"],
      whPerUnit: num(g("whPerUnit")),
      lithiumContentG: num(g("lithiumContentG")),
      stateOfChargePct: num(g("stateOfChargePct")),
      numUnits: num(g("numUnits")),
      operator: (g("operator") || "GENERIC") as ShipmentInput["operator"],
      aircraft: (g("aircraft") || "unspecified") as ShipmentInput["aircraft"],
      condition: (g("condition") || "normal") as ShipmentInput["condition"],
      un38_3TestSummaryAvailable: un38 === "" ? undefined : un38 === "true" || un38 === "yes",
    };
    return input;
  });
}

function download(name: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BatchPage() {
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const shipments = parseCsv(csv);
      if (shipments.length === 0) throw new Error("No data rows found. Include a header row + at least one shipment.");
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch failed");
      setRows(data.results as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch failed");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(setCsv);
  }

  function exportResults() {
    const head = ["row", "un", "psn", "pi", "section", "result", "blocking_issues"].join(",");
    const lines = rows.map((r) => {
      if (!r.ok || !r.result) return `${r.row},,,,,ERROR,"${(r.error ?? "").replace(/"/g, "'")}"`;
      const c = r.result.classification;
      const errs = r.result.findings.filter((f) => f.severity === "error").map((f) => f.code).join(" | ");
      return `${r.row},${c.unNumber},"${c.properShippingName}",${c.packingInstruction},${c.section},${r.result.passed ? "PASS" : "BLOCKED"},"${errs}"`;
    });
    download("batch-results.csv", [head, ...lines].join("\n"));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Batch check</h1>
      <p className="mt-1 text-sm text-slate-600">
        Check many shipments at once. Paste CSV or upload a file, then export the results.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CSV data</label>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={8}
            placeholder={TEMPLATE}
            className="w-full rounded-md border border-slate-300 p-3 font-mono text-xs"
          />
        </div>
        <div className="flex flex-col gap-2">
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-xs" />
          <button
            onClick={() => download("cleartoship-template.csv", TEMPLATE)}
            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-400"
          >
            ⬇ Download template
          </button>
          <button
            onClick={run}
            disabled={loading}
            className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Checking…" : "Run batch"}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Columns: {HEADERS.join(", ")}. chemistry = ion | metal | sodium · configuration =
        standalone | packed_with_equipment | contained_in_equipment.
      </p>

      {error && <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {rows.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              Results — {rows.filter((r) => r.ok && r.result?.passed).length} pass /{" "}
              {rows.filter((r) => !r.ok || !r.result?.passed).length} need attention
            </h2>
            <button onClick={exportResults} className="rounded-md border border-brand px-3 py-1.5 text-xs font-medium text-brand hover:bg-teal-50">
              ⬇ Export results CSV
            </button>
          </div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">UN</th>
                  <th className="px-3 py-2 font-medium">PI</th>
                  <th className="px-3 py-2 font-medium">Section</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium">Blocking issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const errs = r.result?.findings.filter((f) => f.severity === "error") ?? [];
                  return (
                    <tr key={r.row} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 text-slate-500">{r.row}</td>
                      <td className="px-3 py-2">{r.result?.classification.unNumber ?? "—"}</td>
                      <td className="px-3 py-2">{r.result ? `PI ${r.result.classification.packingInstruction}` : "—"}</td>
                      <td className="px-3 py-2">{r.result?.classification.section ?? "—"}</td>
                      <td className="px-3 py-2">
                        {!r.ok ? (
                          <span className="text-red-700">Error</span>
                        ) : r.result?.passed ? (
                          <span className="text-emerald-700">Pass</span>
                        ) : (
                          <span className="text-red-700">Blocked</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {r.error ? r.error : errs.length ? errs.map((f) => f.message).join(" ") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Pre-check only — a trained shipper must verify and sign each declaration.
          </p>
        </div>
      )}
    </div>
  );
}
