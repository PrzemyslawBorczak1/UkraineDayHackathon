/** Display labels + colours for verification output (English). */

export const STATUS_COLOR: Record<string, string> = {
  Approved: "#16a34a",
  "Manual review": "#d97706",
  "Do not use": "#dc2626",
};

export const RISK_COLOR: Record<string, string> = {
  Low: "#16a34a",
  Medium: "#d97706",
  High: "#dc2626",
};

/** Map engine `triggered_rules` to human-readable reasons. */
export const REASON_LABEL: Record<string, string> = {
  sanctions_confirmed_match: "Sanctions hit — excluded",
  company_in_liquidation: "Company in liquidation",
  score_below_threshold: "Verification score below threshold (78)",
  incidents_over_threshold: "3 or more incidents in the last 24 months",
  insurance_not_valid: "Insurance not valid (expiring or missing)",
  transport_licence_not_valid: "Transport licence not valid (expiring or missing)",
  registry_not_active: "Company registry status not active",
  tax_arrears: "Outstanding tax arrears",
  sanctions_pending: "Sanctions screening pending",
  clean: "No issues found",
};

/** Labels for the raw 'public registry' fields. */
export const FIELD_LABEL: Record<string, string> = {
  company_registry_status: "Company registry status",
  transport_licence_status: "Transport licence",
  insurance_status: "Insurance",
  tax_arrears: "Tax arrears",
  sanctions_screening_result: "Sanctions screening",
  incidents_24m: "Incidents (24 mo.)",
  documentation_completeness_pct: "Documentation completeness",
  registry_match_quality: "Registry match quality",
};

export function reasonLabel(rule: string): string {
  return REASON_LABEL[rule] ?? rule;
}

export type Tone = "good" | "warn" | "bad" | "neutral";

/** Severity tone for a raw registry field value, used to colour the chips. */
export function fieldTone(field: string, value: string | number): Tone {
  const v = String(value).toLowerCase();
  switch (field) {
    case "company_registry_status":
      if (v === "active") return "good";
      if (v === "pending review") return "warn";
      return "bad"; // suspended / liquidation
    case "transport_licence_status":
    case "insurance_status":
      if (v === "valid") return "good";
      if (v === "expiring soon") return "warn";
      return "bad"; // no
    case "tax_arrears":
      return v === "no" ? "good" : "warn";
    case "sanctions_screening_result":
      if (v === "no") return "good";
      if (v === "pending") return "warn";
      return "bad"; // confirmed match
    case "incidents_24m": {
      const n = Number(value);
      if (n <= 1) return "good";
      if (n < 3) return "warn";
      return "bad";
    }
    case "documentation_completeness_pct": {
      const n = Number(value);
      if (n >= 80) return "good";
      if (n >= 60) return "warn";
      return "bad";
    }
    case "reliability_score": {
      const n = Number(value);
      if (n >= 75) return "good";
      if (n >= 55) return "warn";
      return "bad";
    }
    default:
      return "neutral";
  }
}

/** Tone for a triggered-rule reason (sanctions/liquidation are hard fails). */
export function reasonTone(rule: string): Tone {
  if (rule === "clean") return "good";
  if (rule === "sanctions_confirmed_match" || rule === "company_in_liquidation") return "bad";
  return "warn";
}

/** Tone for an availability status (vehicles + warehouses share this). */
export function availabilityTone(status: string): Tone {
  switch (status) {
    case "Available":
      return "good";
    case "Available within 6h":
    case "Limited capacity":
      return "warn";
    case "Maintenance":
    case "Unavailable":
      return "bad";
    default: // On mission / Reserved for mission
      return "neutral";
  }
}
