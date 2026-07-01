// DGD-style PDF generator using pdf-lib (pure JS — serverless/Vercel-safe).
//
// NOTE: This produces a lithium-battery compliance summary / draft declaration
// for the trained shipper to review — NOT a carrier-certified Shipper's
// Declaration. The shipper remains responsible for the final signed document
// and for using a carrier-accepted form/system.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { CheckResult } from "@/lib/compliance/types";

const TEAL = rgb(0.06, 0.46, 0.43);
const RED = rgb(0.7, 0.1, 0.1);
const GREEN = rgb(0.06, 0.5, 0.3);
const GREY = rgb(0.35, 0.35, 0.4);
const BLACK = rgb(0.1, 0.1, 0.12);

export interface DgdMeta {
  shipperName?: string;
  consigneeName?: string;
  reference?: string;
}

export async function generateDgdPdf(
  result: CheckResult,
  meta: DgdMeta = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const left = 48;
  let y = height - 56;

  const text = (
    s: string,
    opts: { x?: number; size?: number; font?: typeof font; color?: typeof BLACK } = {}
  ) => {
    page.drawText(ascii(s), {
      x: opts.x ?? left,
      y,
      size: opts.size ?? 10,
      font: opts.font ?? font,
      color: opts.color ?? BLACK,
    });
  };

  // Header
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: TEAL });
  page.drawText("Lithium Battery Compliance Summary", {
    x: left,
    y: height - 50,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Draft / pre-flight review — not a carrier-certified declaration", {
    x: left,
    y: height - 70,
    size: 9,
    font,
    color: rgb(0.85, 0.95, 0.93),
  });

  y = height - 120;

  // Pass / fail banner
  const c = result.classification;
  page.drawRectangle({
    x: left,
    y: y - 6,
    width: width - left * 2,
    height: 26,
    color: result.passed ? rgb(0.9, 0.97, 0.93) : rgb(0.99, 0.92, 0.92),
  });
  text(result.passed ? "RESULT: No blocking issues" : "RESULT: Not ready to ship — blocking issues present", {
    size: 11,
    font: bold,
    color: result.passed ? GREEN : RED,
  });
  y -= 44;

  // Classification block
  text("Classification", { font: bold, size: 12, color: TEAL });
  y -= 18;
  const rows: [string, string][] = [
    ["UN number", c.unNumber],
    ["Proper shipping name", c.properShippingName],
    ["Packing instruction", `PI ${c.packingInstruction}`],
    ["Section", c.section],
    ["Shipper's Declaration", c.dgdRequired ? "Required" : "Not required (Section II)"],
    ["Required marks", c.requiredMarks.join(", ") || "—"],
    ["Required labels", c.requiredLabels.join(", ") || "—"],
  ];
  for (const [k, v] of rows) {
    text(k, { color: GREY, size: 10 });
    text(v, { x: left + 170, size: 10, font: bold });
    y -= 16;
  }

  // Shipment inputs
  y -= 8;
  text("Shipment", { font: bold, size: 12, color: TEAL });
  y -= 18;
  const i = result.input;
  const inputRows: [string, string][] = [
    ["Chemistry", i.chemistry === "ion" ? "Lithium-ion" : "Lithium-metal"],
    ["Configuration", i.configuration.replace(/_/g, " ")],
    ["Item type", i.itemType],
    ["Energy / content", i.whPerUnit != null ? `${i.whPerUnit} Wh` : i.lithiumContentG != null ? `${i.lithiumContentG} g Li` : "—"],
    ["State of charge", i.stateOfChargePct != null ? `${i.stateOfChargePct}%` : "—"],
    ["Carrier", i.operator ?? "GENERIC"],
    ["Shipper", meta.shipperName ?? "—"],
    ["Consignee", meta.consigneeName ?? "—"],
    ["Reference", meta.reference ?? "—"],
  ];
  for (const [k, v] of inputRows) {
    text(k, { color: GREY, size: 10 });
    text(v, { x: left + 170, size: 10, font: bold });
    y -= 16;
  }

  // Findings
  y -= 8;
  text("Findings", { font: bold, size: 12, color: TEAL });
  y -= 18;
  if (result.findings.length === 0) {
    text("No findings.", { size: 10, color: GREY });
    y -= 16;
  } else {
    for (const f of result.findings) {
      const color = f.severity === "error" ? RED : f.severity === "warning" ? rgb(0.7, 0.5, 0.05) : GREY;
      const line = `[${f.severity.toUpperCase()}] ${f.message}`;
      // simple wrap at ~95 chars
      for (const chunk of wrap(line, 95)) {
        text(chunk, { size: 9, color });
        y -= 13;
      }
      if (f.fix) {
        for (const chunk of wrap(`     Fix: ${f.fix}`, 95)) {
          text(chunk, { size: 9, color: GREY });
          y -= 13;
        }
      }
      y -= 3;
      if (y < 140) break; // keep room for footer; multi-page is a later enhancement
    }
  }

  // QR code (encodes a compact JSON summary)
  const payload = JSON.stringify({
    un: c.unNumber,
    pi: c.packingInstruction,
    section: c.section,
    passed: result.passed,
    v: result.rulesetVersion,
    t: result.generatedAt,
  });
  const qrDataUrl = await QRCode.toDataURL(payload, { margin: 0, width: 220 });
  const qrImg = await doc.embedPng(qrDataUrl);
  const qrSize = 90;
  page.drawImage(qrImg, { x: width - left - qrSize, y: 70, width: qrSize, height: qrSize });
  page.drawText("Scan: compliance summary", {
    x: width - left - qrSize,
    y: 60,
    size: 7,
    font,
    color: GREY,
  });

  // Footer / disclaimer
  page.drawLine({ start: { x: left, y: 56 }, end: { x: width - left, y: 56 }, color: rgb(0.85, 0.85, 0.88) });
  const disclaimer =
    "Pre-flight summary only — not legal advice and not a carrier-certified Shipper's Declaration. A trained, certified shipper must verify against the current IATA DGR / 49 CFR and applicable carrier variations and sign the final document.";
  let fy = 44;
  for (const chunk of wrap(disclaimer, 110)) {
    page.drawText(ascii(chunk), { x: left, y: fy, size: 7, font, color: GREY });
    fy -= 10;
  }
  page.drawText(ascii(`Ruleset ${result.rulesetVersion} - ${result.rulesetEdition} - ${result.generatedAt}`), {
    x: left,
    y: 20,
    size: 7,
    font,
    color: GREY,
  });

  return doc.save();
}

// pdf-lib standard fonts only support WinAnsi (Latin-1). Map common unicode to
// ASCII and drop anything else so drawText never throws.
function ascii(s: string): string {
  return s
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[•]/g, "-")
    .replace(/[·]/g, "-")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrap(s: string, max: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
