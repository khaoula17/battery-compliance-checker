// Typed accessor over the versioned ruleset JSON.
// Keeping the regulatory data as data (not hard-coded logic) means a
// regulation change is a JSON edit + a version bump, not a code rewrite.

import rulesData from "./rules/li-rules.json";
import type { Citation } from "./types";

export interface ConfigRule {
  un: string;
  psn: string;
  pi: string;
}

export interface ChemistryRule {
  label: string;
  cellThresholdWh?: number;
  batteryThresholdWh?: number;
  cellThresholdG?: number;
  batteryThresholdG?: number;
  manualClassification?: boolean;
  note?: string;
  configurations: Record<string, ConfigRule>;
}

export interface OperatorRule {
  label: string;
  prohibitsSectionIIStandalone?: boolean;
  sectionIIStandaloneNeedsApproval?: boolean;
  sectionIAPreApproval?: string;
  note?: string;
}

export interface Ruleset {
  version: string;
  edition: string;
  effectiveDate: string;
  lastReviewed: string;
  disclaimer: string;
  chemistries: Record<string, ChemistryRule>;
  stateOfCharge: {
    maxPct: number;
    indicatedMaxPct?: number;
    rules: { un: string; minWhPerUnit: number; scope: string }[];
    note: string;
  };
  documentation: { un38_3Mandatory: boolean; whMarkOnCaseRequiredAfter: string };
  conditions: {
    forbiddenByAir: string[];
    approvalRequired: string[];
    note: string;
  };
  sectionII: {
    availableForConfigurations: string[];
    removedForStandaloneSince: string;
    standaloneNote: string;
    perPackageLimits: {
      verifyNote: string;
      smallWhThreshold: number;
      smallNetKgLimit: number;
      maxCellsAboveSmall: number;
      maxBatteriesAboveSmall: number;
    };
  };
  operatorVariations: Record<string, OperatorRule>;
  citations: Record<string, Citation>;
}

export const rules = rulesData as unknown as Ruleset;

export function cite(key: keyof typeof rulesData.citations): Citation {
  return rules.citations[key as string];
}
