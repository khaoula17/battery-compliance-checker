// Public-facing ruleset change history. Keep in sync with rules/CHANGELOG.md.
// Rendered on /changelog as an "always current" trust + SEO signal.

export interface ChangelogEntry {
  version: string;
  date: string; // ISO
  title: string;
  points: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2026.3",
    date: "2026-07-06",
    title: "Sodium-ion support + DG-review accuracy pass",
    points: [
      "Added sodium-ion battery identification (UN3551 / UN3552, PI 976–978).",
      "Clarified the watt-hour case-marking requirement (US 49 CFR since 10 May 2024).",
      "Added special-provisions and equipment marking-relief guidance.",
      "Confirmed marks-per-section and Cargo Aircraft Only rules against sources.",
    ],
  },
  {
    version: "2026.2",
    date: "2026-07-04",
    title: "Safety hardening",
    points: [
      "Fail-safe classification: incomplete data is treated as fully regulated, never under-classified.",
      "Prototype batteries forced to fully-regulated with the approval requirement.",
      "State-of-charge guidance updated with the State-approval path above 30%.",
    ],
  },
  {
    version: "2026.1",
    date: "2026-07-02",
    title: "Initial ruleset — IATA DGR 67th edition (2026)",
    points: [
      "Standalone lithium (PI 965/968) correctly classified as Section IB/IA (no Section II since 2022).",
      "30% state-of-charge rule for UN3480, expanded to UN3481 with equipment >2.7 Wh (2026).",
      "Damaged/defective, recalled and waste batteries flagged as forbidden by air.",
      "Cargo Aircraft Only handling for standalone UN3480 / UN3090.",
    ],
  },
];
