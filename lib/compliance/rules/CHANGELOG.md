# Ruleset Changelog

A record of every change to the compliance ruleset (`li-rules.json`) and engine
logic. Kept for transparency and audit purposes. Bump the `version` in
`li-rules.json` with each entry.

## 2026.1 — 2026-07-02
Initial published ruleset (IATA DGR 67th edition, 2026 basis), including:
- **Standalone lithium (PI 965 / 968) has no Section II** — reflects the 31 Mar 2022
  removal. Standalone cells/batteries classify as Section IB or IA (fully regulated).
- **Section II** retained only for batteries with equipment (PI 966/967/969/970),
  with per-package quantity auto-calculation (≤2.7 Wh → 2.5 kg net; larger → max
  8 cells / 2 batteries → else Section I).
- **State of charge (≤30%)** hard requirement for UN3480, **and** extended to
  UN3481 with equipment > 2.7 Wh (new in the 67th edition, 2026).
- **Condition prohibitions:** damaged/defective, recalled, and waste/for-disposal
  batteries forbidden by air; prototype/low-production require approval (Section IA).
- **Aircraft:** standalone UN3480 / UN3090 are Cargo Aircraft Only (passenger
  forbidden).
- **Marks/labels per section**, UN 38.3 test-summary check, Wh-mark check.
- **Operator variations** for FedEx / UPS / DHL (pre-approval flags).

> Pending expert verification: exact per-PI Section II quantity tables, PI 967
> "contained in equipment" cell/battery-count exceptions, overpack rules, and the
> full carrier/state variation set. See COMPLIANCE_ROADMAP.md.

## 2026.2 — 2026-07-04
Safety hardening from an adversarial QA audit (engine logic; no regulatory fact
changes — all encoded thresholds/rules were verified correct & current):
- **Fail-safe classification:** missing/invalid Wh or lithium-content now yields
  section UNKNOWN (treated as fully regulated), instead of silently defaulting to
  the least-regulated section. Prevents under-classification.
- **Prototype** condition now forces fully-regulated classification (Section IA/I),
  matching the approval-required finding.
- **Input validation:** non-positive / non-finite size values treated as missing.
- **Section II (equipment) quantity** finding elevated to a warning and reworded —
  the tool does not fully compute the "batteries to power device + 2 spare sets"
  limit; manual verification required.
- **State-of-charge** over-limit fix text now notes the State-of-Origin/Operator
  approval path for shipping above 30%.
- **Citations:** air-mode prohibitions (forbidden conditions) now cite IATA
  guidance (A154) rather than the US 49 CFR ground reference.

## 2026.3 — 2026-07-06
Accuracy + coverage from a DG-reviewer pass (facts verified against IATA/FedEx/49 CFR):
- **Sodium-ion added** (UN3551 / PI 976 standalone; UN3552 / PI 977 packed-with,
  PI 978 contained-in). Identify-only: returns UN/PI and a manual-verification
  warning — no lithium section/threshold or SoC logic applied (ICAO is silent on
  SoC for PI 977/978).
- **Wh-mark wording** clarified: US 49 CFR requires the case Wh marking since
  10 May 2024 (confirmed); IATA by manufacture date.
- **Prototype message** reconciled with classifier (Section IA standalone / I equipment).
- **Section II (equipment)** warning kept; contained-in-equipment **marking-relief**
  note added (≤4 cells / ≤2 batteries installed; button-cell exceptions).
- **Special-provisions** reminder added for fully-regulated lithium (A88/A99/A154/A164/A181).
- Confirmed correct (no change needed): standalone→IB/IA, marks per section
  (II=mark; IB=mark+Class9+CAO; IA=Class9+CAO), UN3480/UN3090 Cargo Aircraft Only.

## [next] — YYYY-MM-DD
- (Log the next change here when the 68th edition / an addendum lands.)
