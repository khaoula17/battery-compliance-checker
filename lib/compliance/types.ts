// Core domain types for the lithium-battery pre-flight compliance engine.
// These are intentionally framework-free so the engine can be unit-tested
// and reused from API routes, the UI, or a future CLI.

export type Chemistry = "ion" | "metal";

export type Configuration =
  | "standalone" // shipped by themselves (UN3480 / UN3090)
  | "packed_with_equipment" // UN3481 / UN3091
  | "contained_in_equipment"; // UN3481 / UN3091

export type ItemType = "cell" | "battery";

export type Operator = "GENERIC" | "FEDEX" | "UPS" | "DHL";

// Physical condition / purpose of the batteries. Several conditions are
// FORBIDDEN for transport by air.
export type Condition =
  | "normal"
  | "damaged_defective" // forbidden by air
  | "recalled" // forbidden by air (unless approved)
  | "waste" // for disposal/recycling — forbidden by air
  | "prototype"; // low-production/prototype — needs approval, Section IA

export type Aircraft = "cargo" | "passenger" | "unspecified";

// What the user (or the AI SDS reader, later) provides about a shipment.
export interface ShipmentInput {
  chemistry: Chemistry;
  configuration: Configuration;
  itemType: ItemType;

  /** Watt-hour rating per cell/battery — required for lithium-ion. */
  whPerUnit?: number;
  /** Lithium content in grams per cell/battery — required for lithium-metal. */
  lithiumContentG?: number;

  /** Net weight of batteries in the package (kg) — optional, informational. */
  netWeightKg?: number;
  /** Number of cells/batteries in the package — optional, informational. */
  numUnits?: number;

  /** % state of charge — relevant for standalone lithium-ion (UN3480). */
  stateOfChargePct?: number;

  /** Whether a UN 38.3 test summary is available from the manufacturer. */
  un38_3TestSummaryAvailable?: boolean;
  /** Whether the Wh rating is marked on the battery case (Li-ion). */
  whMarkedOnCase?: boolean;

  /**
   * Whether the package exceeds the Section II net-quantity limits.
   * Within thresholds but over the Section II quantity → Section IB.
   * (MVP keeps this as a declared flag; full per-PI quantity tables are a later enhancement.)
   */
  exceedsSectionIIQuantity?: boolean;

  /** Carrier whose variations to apply. */
  operator?: Operator;

  /** Physical condition / purpose (some conditions are forbidden by air). */
  condition?: Condition;

  /** Aircraft type the shipment will travel on. */
  aircraft?: Aircraft;
}

// Section I applies to the "packed with / contained in equipment" packing
// instructions (966/967/969/970), which have no IA/IB split. IA/IB apply only
// to standalone batteries (PI 965/968).
export type Section = "II" | "IB" | "IA" | "I" | "UNKNOWN";

export interface Citation {
  ref: string;
  url: string;
}

export interface Classification {
  unNumber: string; // UN3480 / UN3481 / UN3090 / UN3091
  properShippingName: string;
  packingInstruction: string; // 965..970
  section: Section;
  fullyRegulated: boolean; // Section I / IA / IB
  dgdRequired: boolean; // Shipper's Declaration required?
  requiredMarks: string[];
  requiredLabels: string[];
  overThreshold: boolean; // exceeds the Wh / lithium-content threshold
  cargoAircraftOnly: boolean; // forbidden on passenger aircraft
  citations: Citation[];
}

export type Severity = "error" | "warning" | "info";

export interface Finding {
  code: string;
  severity: Severity;
  message: string;
  fix?: string;
  citation?: Citation;
}

export interface CheckResult {
  input: ShipmentInput;
  classification: Classification;
  findings: Finding[];
  /** true when there are no blocking (error-severity) findings. */
  passed: boolean;
  rulesetVersion: string;
  rulesetEdition: string;
  generatedAt: string;
}
