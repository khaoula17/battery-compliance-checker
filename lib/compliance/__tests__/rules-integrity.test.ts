import { createHash } from "crypto";
import rules from "../rules/li-rules.json";

// ---------------------------------------------------------------------------
// RULESET INTEGRITY LOCK
// The ruleset is the core asset. This test makes it *tamper-evident*: any change
// to li-rules.json (accidental, malicious, or a bad merge) fails the test, which
// blocks the deploy — UNLESS the change is deliberate.
//
// TO CHANGE THE RULES ON PURPOSE (new edition / addendum):
//   1. Edit li-rules.json
//   2. Bump `version` + `lastReviewed` in that file
//   3. Add a CHANGELOG.md entry
//   4. Run the test, copy the "actual" hash it prints, and paste it into
//      EXPECTED_HASH below
//   5. Ideally have the DG reviewer confirm the change
// If a hash mismatch appears and you did NOT change the rules → revert; something
// altered the file without authorization.
// ---------------------------------------------------------------------------

const EXPECTED_HASH =
  "51121bfe183eb837194f2d3e2599e09d2eb749e9d1b4d10d456605bd95b1bad0";

// Canonicalize (sort keys, recurse) so formatting/whitespace changes don't trip
// the lock — only actual data changes do.
function canonical(x: any): any {
  if (Array.isArray(x)) return x.map(canonical);
  if (x && typeof x === "object") {
    return Object.keys(x)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = canonical(x[k]);
        return acc;
      }, {});
  }
  return x;
}

function hashRuleset(): string {
  return createHash("sha256").update(JSON.stringify(canonical(rules))).digest("hex");
}

describe("ruleset integrity", () => {
  it("matches the approved fingerprint (deliberate changes only)", () => {
    const actual = hashRuleset();
    if (actual !== EXPECTED_HASH) {
      // Loud, actionable message.
      throw new Error(
        `Ruleset fingerprint changed.\n` +
          `  expected: ${EXPECTED_HASH}\n` +
          `  actual:   ${actual}\n` +
          `If this change is intentional: bump version + add a CHANGELOG entry, ` +
          `then set EXPECTED_HASH to the "actual" value above. ` +
          `If NOT intentional: revert — the ruleset was modified without authorization.`
      );
    }
    expect(actual).toBe(EXPECTED_HASH);
  });
});

describe("ruleset schema (structure + sane values)", () => {
  it("has a version, edition, and effective date", () => {
    expect(typeof (rules as any).version).toBe("string");
    expect((rules as any).version.length).toBeGreaterThan(0);
    expect(typeof (rules as any).edition).toBe("string");
    expect(typeof (rules as any).effectiveDate).toBe("string");
  });

  it("defines ion and metal chemistries with numeric thresholds", () => {
    const chem = (rules as any).chemistries;
    expect(chem.ion.cellThresholdWh).toBeGreaterThan(0);
    expect(chem.ion.batteryThresholdWh).toBeGreaterThan(0);
    expect(chem.metal.cellThresholdG).toBeGreaterThan(0);
    expect(chem.metal.batteryThresholdG).toBeGreaterThan(0);
    for (const c of ["ion", "metal"]) {
      for (const cfg of ["standalone", "packed_with_equipment", "contained_in_equipment"]) {
        const r = chem[c].configurations[cfg];
        expect(r.un).toMatch(/^UN\d{4}$/);
        expect(String(r.pi)).toMatch(/^9\d\d$/);
      }
    }
  });

  it("has a 30% state-of-charge rule and required sub-objects", () => {
    expect((rules as any).stateOfCharge.maxPct).toBe(30);
    expect(Array.isArray((rules as any).stateOfCharge.rules)).toBe(true);
    expect((rules as any).sectionII).toBeDefined();
    expect((rules as any).conditions.forbiddenByAir).toContain("damaged_defective");
    expect((rules as any).operatorVariations.FEDEX).toBeDefined();
    expect(Object.keys((rules as any).citations).length).toBeGreaterThan(0);
  });
});
