import { classify, isOverThreshold } from "../classifier";
import type { ShipmentInput } from "../types";

const base: ShipmentInput = {
  chemistry: "ion",
  configuration: "standalone",
  itemType: "battery",
  whPerUnit: 50,
};

describe("classify — UN number & packing instruction mapping", () => {
  it("ion standalone -> UN3480 / PI965", () => {
    const c = classify({ ...base });
    expect(c.unNumber).toBe("UN3480");
    expect(c.packingInstruction).toBe("965");
  });

  it("ion packed with equipment -> UN3481 / PI966", () => {
    const c = classify({ ...base, configuration: "packed_with_equipment" });
    expect(c.unNumber).toBe("UN3481");
    expect(c.packingInstruction).toBe("966");
  });

  it("ion contained in equipment -> UN3481 / PI967", () => {
    const c = classify({ ...base, configuration: "contained_in_equipment" });
    expect(c.unNumber).toBe("UN3481");
    expect(c.packingInstruction).toBe("967");
  });

  it("metal standalone -> UN3090 / PI968", () => {
    const c = classify({ chemistry: "metal", configuration: "standalone", itemType: "battery", lithiumContentG: 1 });
    expect(c.unNumber).toBe("UN3090");
    expect(c.packingInstruction).toBe("968");
  });

  it("metal contained in equipment -> UN3091 / PI970", () => {
    const c = classify({ chemistry: "metal", configuration: "contained_in_equipment", itemType: "battery", lithiumContentG: 1 });
    expect(c.unNumber).toBe("UN3091");
    expect(c.packingInstruction).toBe("970");
  });
});

describe("isOverThreshold — Section II boundaries", () => {
  it("Li-ion battery at exactly 100 Wh is NOT over threshold", () => {
    expect(isOverThreshold({ ...base, whPerUnit: 100 })).toBe(false);
  });
  it("Li-ion battery at 100.1 Wh IS over threshold", () => {
    expect(isOverThreshold({ ...base, whPerUnit: 100.1 })).toBe(true);
  });
  it("Li-ion cell at exactly 20 Wh is NOT over threshold", () => {
    expect(isOverThreshold({ ...base, itemType: "cell", whPerUnit: 20 })).toBe(false);
  });
  it("Li-ion cell at 21 Wh IS over threshold", () => {
    expect(isOverThreshold({ ...base, itemType: "cell", whPerUnit: 21 })).toBe(true);
  });
  it("Li-metal battery at 2 g is NOT over, 2.1 g IS over", () => {
    expect(isOverThreshold({ chemistry: "metal", configuration: "standalone", itemType: "battery", lithiumContentG: 2 })).toBe(false);
    expect(isOverThreshold({ chemistry: "metal", configuration: "standalone", itemType: "battery", lithiumContentG: 2.1 })).toBe(true);
  });
});

describe("classify — section, DGD, marks & labels", () => {
  it("small standalone battery -> Section IB (no Section II for standalone since 2022)", () => {
    const c = classify({ ...base, whPerUnit: 50 });
    expect(c.section).toBe("IB");
    expect(c.dgdRequired).toBe(true);
    expect(c.requiredMarks).toContain("Lithium battery mark");
    expect(c.requiredLabels).toContain("Class 9 lithium battery hazard label");
  });

  it("small battery CONTAINED IN EQUIPMENT within limits -> Section II, no DGD, mark only", () => {
    const c = classify({ ...base, configuration: "contained_in_equipment", whPerUnit: 50 });
    expect(c.section).toBe("II");
    expect(c.dgdRequired).toBe(false);
    expect(c.requiredMarks).toContain("Lithium battery mark");
    expect(c.requiredLabels).toHaveLength(0);
  });

  it("over-threshold standalone -> Section IA, DGD, Class 9, NO lithium mark", () => {
    const c = classify({ ...base, whPerUnit: 150 });
    expect(c.section).toBe("IA");
    expect(c.dgdRequired).toBe(true);
    expect(c.requiredLabels).toContain("Class 9 lithium battery hazard label");
    expect(c.requiredMarks).not.toContain("Lithium battery mark");
  });

  it("standalone within threshold is IB regardless of quantity flag", () => {
    const c = classify({ ...base, whPerUnit: 50, exceedsSectionIIQuantity: true });
    expect(c.section).toBe("IB");
    expect(c.dgdRequired).toBe(true);
  });

  it("equipment PI: over-threshold contained_in_equipment -> Section I (not IA)", () => {
    const c = classify({ ...base, configuration: "contained_in_equipment", whPerUnit: 150 });
    expect(c.section).toBe("I");
    expect(c.dgdRequired).toBe(true);
  });

  it("equipment PI: over Section II quantity flag -> Section I", () => {
    const c = classify({ ...base, configuration: "packed_with_equipment", whPerUnit: 50, exceedsSectionIIQuantity: true });
    expect(c.section).toBe("I");
  });

  it("equipment PI: auto-detects Section II quantity breach (>2 batteries >2.7Wh) -> Section I", () => {
    const c = classify({ ...base, configuration: "packed_with_equipment", itemType: "battery", whPerUnit: 50, numUnits: 3 });
    expect(c.section).toBe("I");
  });

  it("equipment PI: within quantity (2 batteries) stays Section II", () => {
    const c = classify({ ...base, configuration: "packed_with_equipment", itemType: "battery", whPerUnit: 50, numUnits: 2 });
    expect(c.section).toBe("II");
  });

  it("standalone lithium-ion is Cargo Aircraft Only", () => {
    expect(classify({ ...base, whPerUnit: 50 }).cargoAircraftOnly).toBe(true);
  });

  it("contained-in-equipment is NOT cargo aircraft only", () => {
    expect(classify({ ...base, configuration: "contained_in_equipment", whPerUnit: 50 }).cargoAircraftOnly).toBe(false);
  });

  it("attaches citations", () => {
    const c = classify({ ...base });
    expect(c.citations.length).toBeGreaterThan(0);
    expect(c.citations[0].url).toMatch(/^https?:\/\//);
  });
});

describe("classify — fail-safe & prototype (safety)", () => {
  it("missing Wh (ion) -> section UNKNOWN, fully regulated (never under-classifies)", () => {
    const c = classify({ chemistry: "ion", configuration: "standalone", itemType: "battery" });
    expect(c.section).toBe("UNKNOWN");
    expect(c.fullyRegulated).toBe(true);
    expect(c.dgdRequired).toBe(true);
  });
  it("zero or negative Wh is treated as missing -> UNKNOWN", () => {
    expect(classify({ chemistry: "ion", configuration: "standalone", itemType: "battery", whPerUnit: 0 }).section).toBe("UNKNOWN");
    expect(classify({ chemistry: "ion", configuration: "standalone", itemType: "battery", whPerUnit: -5 }).section).toBe("UNKNOWN");
  });
  it("missing lithium content (metal) -> UNKNOWN", () => {
    expect(classify({ chemistry: "metal", configuration: "standalone", itemType: "battery" }).section).toBe("UNKNOWN");
  });
  it("prototype standalone forces Section IA regardless of size", () => {
    const c = classify({ chemistry: "ion", configuration: "standalone", itemType: "battery", whPerUnit: 10, condition: "prototype" });
    expect(c.section).toBe("IA");
  });
  it("prototype in equipment forces Section I", () => {
    const c = classify({ chemistry: "ion", configuration: "contained_in_equipment", itemType: "battery", whPerUnit: 10, condition: "prototype" });
    expect(c.section).toBe("I");
  });
});
