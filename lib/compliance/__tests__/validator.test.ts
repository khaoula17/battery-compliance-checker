import { runCheck } from "../index";
import { classify } from "../classifier";
import { validate } from "../validator";
import type { ShipmentInput } from "../types";

const okIon: ShipmentInput = {
  chemistry: "ion",
  configuration: "standalone",
  itemType: "battery",
  whPerUnit: 50,
  stateOfChargePct: 25,
  un38_3TestSummaryAvailable: true,
  whMarkedOnCase: true,
  operator: "GENERIC",
};

function codes(input: ShipmentInput): string[] {
  return validate(input, classify(input)).map((f) => f.code);
}

describe("validate — required data", () => {
  it("flags missing Wh for lithium-ion as a blocking error", () => {
    const input: ShipmentInput = { chemistry: "ion", configuration: "standalone", itemType: "battery" };
    expect(codes(input)).toContain("MISSING_WH");
    expect(runCheck(input).passed).toBe(false);
  });

  it("flags missing lithium content for lithium-metal", () => {
    const input: ShipmentInput = { chemistry: "metal", configuration: "standalone", itemType: "battery" };
    expect(codes(input)).toContain("MISSING_LI_CONTENT");
  });
});

describe("validate — UN 38.3", () => {
  it("blocks when test summary explicitly unavailable", () => {
    const input = { ...okIon, un38_3TestSummaryAvailable: false };
    expect(codes(input)).toContain("MISSING_UN38_3");
    expect(runCheck(input).passed).toBe(false);
  });
  it("warns when availability unknown", () => {
    const input = { ...okIon, un38_3TestSummaryAvailable: undefined };
    expect(codes(input)).toContain("UNKNOWN_UN38_3");
  });
});

describe("validate — state of charge (UN3480)", () => {
  it("blocks SoC over 30% for UN3480", () => {
    const input = { ...okIon, stateOfChargePct: 60 };
    expect(codes(input)).toContain("SOC_OVER_LIMIT");
    expect(runCheck(input).passed).toBe(false);
  });
  it("passes SoC at exactly 30%", () => {
    const input = { ...okIon, stateOfChargePct: 30 };
    expect(codes(input)).not.toContain("SOC_OVER_LIMIT");
  });
  it("applies SoC to UN3481 with equipment > 2.7 Wh (new 2026 rule)", () => {
    const input: ShipmentInput = { ...okIon, configuration: "contained_in_equipment", whPerUnit: 50, stateOfChargePct: 90 };
    expect(codes(input)).toContain("SOC_OVER_LIMIT");
  });
  it("does NOT apply SoC to UN3481 with tiny cells <= 2.7 Wh", () => {
    const input: ShipmentInput = { ...okIon, configuration: "packed_with_equipment", whPerUnit: 2, stateOfChargePct: 90 };
    expect(codes(input)).not.toContain("SOC_OVER_LIMIT");
  });
});

describe("validate — operator variations", () => {
  it("FedEx: standalone lithium needs approval (warning, not blocking)", () => {
    const input = { ...okIon, operator: "FEDEX" as const };
    expect(codes(input)).toContain("OPERATOR_STANDALONE_APPROVAL");
    expect(runCheck(input).passed).toBe(true);
  });
  it("DHL: standalone lithium needs approval", () => {
    const input = { ...okIon, operator: "DHL" as const };
    expect(codes(input)).toContain("OPERATOR_STANDALONE_APPROVAL");
  });
  it("Generic operator adds no operator findings", () => {
    const c = codes(okIon);
    expect(c).not.toContain("OPERATOR_STANDALONE_APPROVAL");
    expect(c).not.toContain("OPERATOR_IA_PREAPPROVAL");
  });
  it("FedEx fully-regulated triggers pre-approval code (A88/A99)", () => {
    const input = { ...okIon, whPerUnit: 200, operator: "FEDEX" as const };
    expect(codes(input)).toContain("OPERATOR_IA_PREAPPROVAL");
  });
});

describe("validate — declaration signer reminder", () => {
  it("adds trained-signer info when a DGD is required", () => {
    const input = { ...okIon, whPerUnit: 200 }; // Section IA
    expect(codes(input)).toContain("DGD_TRAINED_SIGNER");
  });
  it("no DGD reminder for a clean equipment Section II", () => {
    const input: ShipmentInput = { ...okIon, configuration: "contained_in_equipment" };
    expect(codes(input)).not.toContain("DGD_TRAINED_SIGNER");
  });
});

describe("validate — aircraft & section II limits", () => {
  it("flags standalone lithium-ion as Cargo Aircraft Only", () => {
    expect(codes(okIon)).toContain("CARGO_AIRCRAFT_ONLY");
  });
  it("does not flag CAO for contained-in-equipment", () => {
    const input: ShipmentInput = { ...okIon, configuration: "contained_in_equipment" };
    expect(codes(input)).not.toContain("CARGO_AIRCRAFT_ONLY");
  });
  it("adds Section II quantity-limit info note for equipment Section II", () => {
    const input: ShipmentInput = { ...okIon, configuration: "contained_in_equipment" };
    expect(codes(input)).toContain("SECTION_II_LIMITS");
  });
});

describe("runCheck — overall", () => {
  it("a clean standalone lithium-ion shipment is Section IB and passes", () => {
    const result = runCheck(okIon);
    expect(result.passed).toBe(true);
    expect(result.classification.section).toBe("IB");
    expect(result.rulesetVersion).toBeTruthy();
  });
});
