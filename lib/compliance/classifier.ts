// Classifier: maps a ShipmentInput to its UN number, packing instruction,
// section, and the marks/labels/declaration it requires — following the IATA
// DGR lithium-battery structure.
//
// This replaces the (incorrect) "Q-value" idea from the original plan. For
// lithium batteries the governing variable is the watt-hour rating (lithium-ion)
// or lithium content in grams (lithium-metal) — NOT the Q-value.
//
// Section structure (current DGR):
//   - Standalone (PI 965 UN3480 / PI 968 UN3090): Sections IA, IB.
//       *** Section II was REMOVED for standalone effective 31 March 2022. ***
//       Standalone cells/batteries must ship fully regulated (IB or IA).
//   - With equipment (PI 966/967 UN3481, PI 969/970 UN3091): Sections I, II.
//       Section II is excepted from the full Declaration when within the
//       Section II watt-hour AND per-package quantity limits.
//
// Aircraft: standalone lithium ion (UN3480) and lithium metal (UN3090) are
// FORBIDDEN ON PASSENGER AIRCRAFT — Cargo Aircraft Only (CAO).

import { rules, cite, type ConfigRule } from "./rules";
import type { Citation, Classification, ShipmentInput } from "./types";

function resolveConfig(input: ShipmentInput): ConfigRule {
  const chem = rules.chemistries[input.chemistry];
  const cfg = chem.configurations[input.configuration];
  if (!cfg) {
    throw new Error(
      `Unknown configuration "${input.configuration}" for chemistry "${input.chemistry}"`
    );
  }
  return cfg;
}

/** Whether the size input needed to classify is present and valid (> 0, finite). */
export function hasValidSize(input: ShipmentInput): boolean {
  const v = input.chemistry === "ion" ? input.whPerUnit : input.lithiumContentG;
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

/** True when the item exceeds the Section II size threshold. */
export function isOverThreshold(input: ShipmentInput): boolean {
  const chem = rules.chemistries[input.chemistry];
  if (input.chemistry === "ion") {
    const wh = input.whPerUnit;
    if (wh == null) return false; // can't tell; validator flags the missing value
    const limit =
      input.itemType === "cell" ? chem.cellThresholdWh! : chem.batteryThresholdWh!;
    return wh > limit;
  }
  const g = input.lithiumContentG;
  if (g == null) return false;
  const limit =
    input.itemType === "cell" ? chem.cellThresholdG! : chem.batteryThresholdG!;
  return g > limit;
}

/**
 * Whether the package exceeds the Section II per-package quantity limits.
 * Uses the user-declared flag OR an auto-calculation from numUnits / netWeightKg.
 * (Section II quantity limits only matter for the equipment PIs.)
 */
export function exceedsSectionIIQuantity(input: ShipmentInput): boolean {
  if (input.exceedsSectionIIQuantity) return true;
  const lim = rules.sectionII.perPackageLimits;
  const wh = input.whPerUnit;

  // Small cells/batteries (≤ 2.7 Wh) are limited by net weight (2.5 kg).
  if (wh != null && wh <= lim.smallWhThreshold) {
    if (input.netWeightKg != null && input.netWeightKg > lim.smallNetKgLimit) return true;
    return false;
  }

  // Larger cells/batteries are limited by count per package.
  if (input.numUnits != null) {
    const max = input.itemType === "cell" ? lim.maxCellsAboveSmall : lim.maxBatteriesAboveSmall;
    if (input.numUnits > max) return true;
  }
  return false;
}

export function classify(input: ShipmentInput): Classification {
  const cfg = resolveConfig(input);

  // Sodium-ion: identify UN number + packing instruction only. Its provisions
  // differ from lithium (and ICAO is silent on state of charge for PI 977/978),
  // so we do NOT apply lithium section/threshold logic. Treated conservatively
  // as fully regulated pending manual verification (validator adds guidance).
  if (input.chemistry === "sodium") {
    return {
      unNumber: cfg.un,
      properShippingName: cfg.psn,
      packingInstruction: cfg.pi,
      section: "UNKNOWN",
      fullyRegulated: true,
      dgdRequired: true,
      requiredMarks: [],
      requiredLabels: ["Class 9 hazard label"],
      overThreshold: false,
      cargoAircraftOnly: false,
      citations: [cite("sodium")],
    };
  }

  const overThreshold = isOverThreshold(input);
  const isStandalone = input.configuration === "standalone";
  const sectionIIAvailable =
    rules.sectionII.availableForConfigurations.includes(input.configuration);

  let section: Classification["section"];
  if (!hasValidSize(input)) {
    // FAIL SAFE: without a valid Wh / lithium-content value we cannot classify.
    // Never default to the least-regulated section — return UNKNOWN (treated as
    // fully regulated) so we never under-classify. The validator flags the
    // missing value as a blocking error.
    section = "UNKNOWN";
  } else if (input.condition === "prototype") {
    // Prototype / low-production must ship fully regulated (Section IA / I) with
    // competent-authority approval — force it regardless of size.
    section = isStandalone ? "IA" : "I";
  } else if (isStandalone) {
    // No Section II for standalone since 2022 → always fully regulated.
    section = overThreshold ? "IA" : "IB";
  } else {
    // Equipment PIs: Section I if over the Wh threshold OR over the Section II
    // per-package quantity limits; otherwise Section II.
    const overQty = exceedsSectionIIQuantity(input);
    section = overThreshold || overQty || !sectionIIAvailable ? "I" : "II";
  }

  // Section II is the only excepted case; everything else (incl. UNKNOWN) is
  // treated as fully regulated so the output never under-states requirements.
  const fullyRegulated = section !== "II";

  // Marks & labels per section:
  //   Section II  → lithium battery mark only (no Class 9, no Declaration)
  //   Section IB  → Class 9 label + lithium battery mark + Declaration
  //   Section IA  → Class 9 label + Declaration (no lithium battery mark)
  //   Section I   → Class 9 label + Declaration (no lithium battery mark)
  const requiredMarks: string[] = [];
  const requiredLabels: string[] = [];
  if (section === "II" || section === "IB") {
    requiredMarks.push("Lithium battery mark");
  }
  if (fullyRegulated) {
    requiredLabels.push("Class 9 lithium battery hazard label");
  }

  const cargoAircraftOnly =
    isStandalone && (cfg.un === "UN3480" || cfg.un === "UN3090");
  if (cargoAircraftOnly && fullyRegulated) {
    requiredLabels.push("Cargo Aircraft Only label");
  }

  const citations: Citation[] = [cite("iata_li_guidance")];
  if (input.chemistry === "ion") citations.push(cite("cfr_173_185"));

  return {
    unNumber: cfg.un,
    properShippingName: cfg.psn,
    packingInstruction: cfg.pi,
    section,
    fullyRegulated,
    dgdRequired: fullyRegulated,
    requiredMarks,
    requiredLabels,
    overThreshold,
    cargoAircraftOnly,
    citations,
  };
}
