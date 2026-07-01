// Public entry point for the compliance engine.
// runCheck() = classify + validate + assemble a CheckResult.

import { classify } from "./classifier";
import { validate } from "./validator";
import { rules } from "./rules";
import type { CheckResult, ShipmentInput } from "./types";

export * from "./types";
export { classify } from "./classifier";
export { validate } from "./validator";
export { rules } from "./rules";

export function runCheck(input: ShipmentInput): CheckResult {
  const classification = classify(input);
  const findings = validate(input, classification);
  const passed = !findings.some((f) => f.severity === "error");

  return {
    input,
    classification,
    findings,
    passed,
    rulesetVersion: rules.version,
    rulesetEdition: rules.edition,
    generatedAt: new Date().toISOString(),
  };
}
