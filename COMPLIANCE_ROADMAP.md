# Path to "100% compliant" — Battery Compliance Checker

Honest scope statement: a self-serve tool can get *very* accurate, but "100%
compliant / guaranteed no fines" is a claim no software can truthfully make,
because a **trained, certified human legally signs and owns the declaration**.
What you *can* reach is: "covers the full IATA DGR lithium-battery rule set for
air, validated by a DG-certified professional, kept current every edition."

This document lists exactly what stands between today's MVP and that bar.

---

## A. What the checker already does correctly (air, lithium)

- UN number + packing instruction mapping (PI 965–970)
- Section IB / IA / I / II logic, with the current-DGR structure:
  **standalone (PI 965/968) has NO Section II since 31 Mar 2022 → IB or IA**;
  equipment PIs (966/967/969/970) → Section I or II
- Watt-hour (Li-ion) and lithium-content (Li-metal) thresholds
- **Section II per-package quantity limits auto-calculated** for equipment
  (≤2.7 Wh → 2.5 kg net; larger → max 8 cells / 2 batteries) → pushes to Section I
- Shipper's Declaration required? + correct marks/labels per section
- 30% state-of-charge — UN3480, **and UN3481 with equipment > 2.7 Wh (2026)**
- UN 38.3 test-summary check; Wh-mark-on-case check
- Cargo Aircraft Only / passenger-forbidden for standalone lithium
- FedEx / UPS / DHL operator variations (approval flags)
- Every finding carries a regulatory citation

## B. What must be ADDED for full IATA DGR (air) fidelity — code work

Ranked by how often it bites a real shipment.

1. **Section II quantity limits — refine per-PI (partly done).**
   Done: the common per-package limits (2.5 kg / 8 cells / 2 batteries) auto-
   calculate for equipment PIs, and standalone's Section II removal is handled.
   Still needed: the exact per-PI nuances (esp. PI 967 "contained in equipment"
   — the ≤4 cells / ≤2 batteries installed exception and equipment-count limits),
   and confirming each number against the licensed DGR text.

2. **Aircraft type handling (passenger vs cargo) as an input.**
   Let the user pick passenger/cargo and validate allowances per PI/section
   (e.g., Section IA/IB forbidden on passenger; Section II quantity differs by
   aircraft). Today CAO is inferred only for standalone.

3. **"Contained in / packed with equipment" special cases.**
   Button/coin cells, ≤4 cells / ≤2 batteries installed exceptions, equipment
   quantity limits, and the equipment-specific marking rules.

4. **Overpack rules.** Marks/label replication, "OVERPACK" marking, quantity
   aggregation across inner packages.

5. **Special provisions & lithium sub-cases.**
   Damaged/defective/recalled (forbidden by air / special approval), prototypes
   & low-production (Section IA + approval), waste batteries, sodium-ion (new),
   batteries powering equipment in transit.

6. **Full State & Operator Variations table.**
   Beyond FedEx/UPS/DHL — all carrier variations (many) and State variations
   that apply to the route. This is a large, living dataset.

7. **Complete label/mark geometry & documentation checks.**
   Mark dimensions, "cargo aircraft only" label, handling labels, air waybill
   statements, and the exact Shipper's Declaration field validation.

8. **UN 38.3 deeper checks** (report elements, test report vs summary) and the
   Wh/lithium-content marking rules per current edition.

## C. What must be ADDED beyond code (the parts that actually make it "trusted")

These matter MORE than the code for being able to sell it as compliant.

1. **DG-certified professional review + sign-off** of `li-rules.json` and the
   classifier/validator. This is the single most important item. It's what lets
   you say "validated by a DGSA / IATA-certified expert" — a real trust signal.
2. **Licensed regulatory source.** The IATA DGR is copyrighted. To claim full
   coverage you need the official DGR (or a licensed data feed) as the source of
   truth — not blog summaries. Budget for the manual/data licence.
3. **Per-edition update process.** IATA publishes a new edition yearly (plus
   addenda). You need a documented process to update the ruleset and re-validate
   each edition, with the version shown to users (already surfaced via
   `/api/reg-version`).
4. **Scope other transport modes** only if you promise them: IMDG (sea), ADR
   (road), 49 CFR ground. Today the tool is **air-only** — keep the marketing
   air-only until these exist.
5. **Clear liability framing** (already in the product): pre-check, not legal
   advice; trained shipper signs; verify carrier acceptance. Keep it.

## D. Recommended sequencing

- **Now → launch:** ship as an **air, lithium pre-check** with the honest
  disclaimer. Do NOT claim full DGR coverage yet.
- **Before charging seriously:** get item C1 (DG-pro review) + C2 (licensed
  source). Add B1 (Section II quantity tables) and B2 (aircraft type) — these
  remove the most false results.
- **Then:** B3–B8 to approach full air fidelity; add a DGSA-maintained variation
  table.
- **Later / optional:** other transport modes (IMDG/ADR/49 CFR ground), EU.

## E. How to phrase it honestly at each stage

- Today: "Free IATA-based pre-flight check for lithium batteries by air. Catches
  common errors. Not a substitute for the DGR or a certified shipper."
- After C1+C2+B1+B2: "Lithium air-shipment compliance checker, ruleset reviewed
  by a DG-certified professional and updated each IATA edition."
- Never: "100% compliant" or "guaranteed no fines."
