// Validator: given a ShipmentInput and its Classification, produce the
// findings (blocking errors, warnings, info) that drive the pre-flight check.
// This is the "compliance checker" value: catch problems BEFORE the shipment
// reaches the carrier portal.

import { rules, cite } from "./rules";
import type { Classification, Finding, ShipmentInput } from "./types";

function labelForCondition(c: string): string {
  switch (c) {
    case "damaged_defective":
      return "Damaged or defective";
    case "recalled":
      return "Recalled";
    case "waste":
      return "Waste / for-disposal";
    default:
      return c;
  }
}

export function validate(
  input: ShipmentInput,
  cls: Classification
): Finding[] {
  const findings: Finding[] = [];

  // --- Condition-based prohibitions (checked first — these override) ---
  const condition = input.condition ?? "normal";
  if (rules.conditions.forbiddenByAir.includes(condition)) {
    findings.push({
      code: "FORBIDDEN_BY_AIR",
      severity: "error",
      message: `${labelForCondition(condition)} lithium batteries are forbidden for transport by air (IATA Special Provision A154).`,
      fix: "These must not be shipped by air. Use approved ground disposal/recycling channels, or obtain special competent-authority approval.",
      citation: cite("iata_li_guidance"),
    });
  }
  if (rules.conditions.approvalRequired.includes(condition)) {
    findings.push({
      code: "CONDITION_APPROVAL_REQUIRED",
      severity: "error",
      message: "Prototype / low-production-run lithium batteries require competent-authority approval and must ship fully regulated (Section IA for standalone, Section I in/with equipment).",
      fix: "Obtain State-of-Origin / competent-authority approval before shipping.",
      citation: cite("iata_li_guidance"),
    });
  }

  // --- Aircraft type vs Cargo Aircraft Only ---
  if (input.aircraft === "passenger" && cls.cargoAircraftOnly) {
    findings.push({
      code: "PASSENGER_FORBIDDEN",
      severity: "error",
      message: `${cls.unNumber} is forbidden on passenger aircraft — you selected passenger aircraft.`,
      fix: "Ship on a cargo aircraft (CAO), or choose a service that offers cargo-aircraft transport.",
      citation: cite("iata_li_guidance"),
    });
  }

  // --- Sodium-ion: identification only ---
  if (input.chemistry === "sodium") {
    findings.push({
      code: "SODIUM_MANUAL",
      severity: "warning",
      message: `${cls.unNumber} (PI ${cls.packingInstruction}) identified. Sodium-ion provisions differ from lithium and ICAO is silent on state of charge for PI 977/978 — this tool provides identification only; verify section, quantity, and packaging manually against the current DGR.`,
      fix: "Have a trained shipper verify the full sodium-ion classification against the DGR.",
      citation: cite("sodium"),
    });
  }

  // --- Required data present? ---
  if (input.chemistry === "ion" && input.whPerUnit == null) {
    findings.push({
      code: "MISSING_WH",
      severity: "error",
      message: "Watt-hour rating per unit is required for lithium-ion to classify the shipment.",
      fix: "Enter the Wh rating from the battery datasheet / case marking.",
      citation: cite("iata_li_guidance"),
    });
  }
  if (input.chemistry === "metal" && input.lithiumContentG == null) {
    findings.push({
      code: "MISSING_LI_CONTENT",
      severity: "error",
      message: "Lithium content (grams) per unit is required for lithium-metal to classify the shipment.",
      fix: "Enter the lithium content from the battery datasheet.",
      citation: cite("iata_li_guidance"),
    });
  }

  // --- UN 38.3 test summary (mandatory since 1 Jan 2020) ---
  if (rules.documentation.un38_3Mandatory && input.un38_3TestSummaryAvailable === false) {
    findings.push({
      code: "MISSING_UN38_3",
      severity: "error",
      message: "UN 38.3 test summary is not available. It is mandatory to be able to make it available on request.",
      fix: "Obtain the UN 38.3 test summary from the cell/battery manufacturer before shipping.",
      citation: cite("un38_3"),
    });
  } else if (input.un38_3TestSummaryAvailable == null) {
    findings.push({
      code: "UNKNOWN_UN38_3",
      severity: "warning",
      message: "UN 38.3 test summary availability not confirmed.",
      fix: "Confirm the manufacturer can provide the UN 38.3 test summary.",
      citation: cite("un38_3"),
    });
  }

  // --- Wh mark on case (Li-ion). 49 CFR 173.185 requires the Wh rating marked
  //     on the case since 10 May 2024; IATA requires it by manufacture date. ---
  if (input.chemistry === "ion" && input.whMarkedOnCase === false) {
    findings.push({
      code: "WH_NOT_MARKED",
      severity: "warning",
      message: "Watt-hour rating is not marked on the battery case. Marking the Wh rating on the case is required for lithium-ion cells/batteries (US 49 CFR since 10 May 2024; IATA by manufacture date).",
      fix: "Ensure the Wh rating is marked on the battery, or confirm with the manufacturer.",
      citation: cite("cfr_173_185"),
    });
  }

  // --- State of charge (hard rule, 67th ed. 2026) ---
  // UN3480 (standalone) always; UN3481 with equipment when cells/batteries
  // exceed 2.7 Wh (new expansion in the 2026 edition).
  const socRule = rules.stateOfCharge.rules.find((r) => r.un === cls.unNumber);
  if (socRule) {
    const socApplies =
      socRule.minWhPerUnit <= 0 ||
      (input.whPerUnit != null && input.whPerUnit > socRule.minWhPerUnit);
    if (socApplies) {
      const max = rules.stateOfCharge.maxPct;
      const citation = cls.unNumber === "UN3481" ? cite("soc_2026") : cite("soc_30");
      if (input.stateOfChargePct != null && input.stateOfChargePct > max) {
        findings.push({
          code: "SOC_OVER_LIMIT",
          severity: "error",
          message: `State of charge ${input.stateOfChargePct}% exceeds the ${max}% limit for ${cls.unNumber} (${socRule.scope}).`,
          fix: `Discharge to ${max}% of rated capacity (or ${rules.stateOfCharge.indicatedMaxPct ?? 25}% indicated) or less before shipping. Shipping above the limit requires approval from the States of Origin and Operator.`,
          citation,
        });
      } else if (input.stateOfChargePct == null) {
        findings.push({
          code: "SOC_UNKNOWN",
          severity: "warning",
          message: `State of charge not provided. ${cls.unNumber} must be at ${max}% or less (hard requirement, 67th ed. 2026).`,
          fix: `Confirm and record state of charge <= ${max}%.`,
          citation,
        });
      }
    }
  }

  // --- Operator (carrier) variations ---
  const op = rules.operatorVariations[input.operator ?? "GENERIC"];
  const isStandalone = input.configuration === "standalone";
  if (op && input.operator && input.operator !== "GENERIC") {
    // Standalone lithium is now always fully regulated (no Section II since
    // 2022); the majors restrict it and generally require pre-approval.
    if (isStandalone && (cls.unNumber === "UN3480" || cls.unNumber === "UN3090")) {
      findings.push({
        code: "OPERATOR_STANDALONE_APPROVAL",
        severity: "warning",
        message: `${op.label} restricts standalone lithium batteries (${cls.unNumber}) and generally requires pre-approval. ${op.note ?? ""}`.trim(),
        fix: "Contact the carrier's dangerous-goods team for approval before tendering.",
        citation: cite("fedex_batteries"),
      });
    } else if (cls.section === "II" && op.sectionIIStandaloneNeedsApproval) {
      // Batteries with equipment offered as Section II — some carriers require conditions.
      findings.push({
        code: "OPERATOR_NEEDS_APPROVAL",
        severity: "warning",
        message: `${op.label} may impose conditions/approval for lithium batteries with equipment. ${op.note ?? ""}`.trim(),
        fix: "Confirm carrier acceptance before tendering.",
        citation: cite("fedex_batteries"),
      });
    }

    // FedEx pre-approval code (A88/A99) for fully regulated lithium.
    if (cls.fullyRegulated && op.sectionIAPreApproval) {
      findings.push({
        code: "OPERATOR_IA_PREAPPROVAL",
        severity: "warning",
        message: `${op.label} requires pre-approval (${op.sectionIAPreApproval}) for fully regulated lithium shipments.`,
        fix: "Request carrier pre-approval before shipping.",
        citation: cite("fedex_batteries"),
      });
    }
  }

  // --- Passenger aircraft forbidden (Cargo Aircraft Only) ---
  if (cls.cargoAircraftOnly) {
    findings.push({
      code: "CARGO_AIRCRAFT_ONLY",
      severity: "warning",
      message: `Standalone ${cls.unNumber} is forbidden on passenger aircraft — Cargo Aircraft Only (CAO).`,
      fix: "Book a cargo-aircraft service; fully regulated packages also need the Cargo Aircraft Only label.",
      citation: cite("iata_li_guidance"),
    });
  }

  // --- Section II quantity / package limits (not auto-computed) ---
  if (cls.section === "II") {
    findings.push({
      code: "SECTION_II_LIMITS",
      severity: "warning",
      message: "Section II for batteries with equipment has specific quantity limits (generally the number of batteries required to power the device plus at most 2 spare sets, with per-package and consignment limits) that this tool does not fully calculate.",
      fix: "Manually verify the package is within the Section II quantity limits for this packing instruction before shipping.",
      citation: cite("iata_li_guidance"),
    });
  }

  // --- Contained-in-equipment marking relief (button/installed cells) ---
  if (input.configuration === "contained_in_equipment") {
    findings.push({
      code: "EQUIPMENT_MARKING_RELIEF",
      severity: "info",
      message: "Equipment containing no more than 4 cells or 2 batteries installed may qualify for marking relief (and low-power/button cells have further exceptions). Check whether the relief applies.",
      citation: cite("iata_li_guidance"),
    });
  }

  // --- Special provisions reminder (fully regulated lithium) ---
  if (cls.fullyRegulated && input.chemistry !== "sodium") {
    findings.push({
      code: "SPECIAL_PROVISIONS",
      severity: "info",
      message: "Check any applicable Special Provisions for your UN number and route (e.g. A88/A99 approvals, A154 damaged/defective, A164, A181).",
      citation: cite("special_provisions"),
    });
  }

  // --- Fully regulated => certified signer reminder ---
  if (cls.dgdRequired) {
    findings.push({
      code: "DGD_TRAINED_SIGNER",
      severity: "info",
      message: "A Shipper's Declaration is required and must be signed by a person with current dangerous-goods training (recurrent every 24 months).",
      citation: cite("iata_training"),
    });
  }

  return findings;
}
