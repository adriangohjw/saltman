/**
 * Severity calculation utilities based on VAPT standards
 * Combines exploitability and impact to determine appropriate severity
 */

import type { Exploitability, Impact, Severity } from "../types";

/**
 * Severity matrix mapping exploitability and impact to severity (VAPT-aligned)
 * Rows: exploitability levels, Columns: impact types
 */
const SEVERITY_MATRIX: Record<Exploitability, Record<Impact, Severity>> = {
  easy: {
    system_compromise: "critical",
    data_breach: "critical",
    privilege_escalation: "critical",
    denial_of_service: "high",
    data_modification: "high",
    information_disclosure: "medium",
    minimal: "low",
  },
  medium: {
    system_compromise: "critical",
    data_breach: "critical",
    privilege_escalation: "high",
    denial_of_service: "high",
    data_modification: "high",
    information_disclosure: "medium",
    minimal: "low",
  },
  hard: {
    system_compromise: "high",
    data_breach: "high",
    privilege_escalation: "medium",
    denial_of_service: "medium",
    data_modification: "medium",
    information_disclosure: "low",
    minimal: "low",
  },
};

/**
 * Calculate severity based on exploitability and impact (VAPT-aligned)
 * This is a helper function that can validate or suggest severity levels
 */
export const calculateSeverity = (
  exploitability: Exploitability | null | undefined,
  impact: Impact | null | undefined,
): Severity | null => {
  if (!exploitability || !impact) {
    return null;
  }

  return SEVERITY_MATRIX[exploitability]?.[impact] ?? null;
};

/**
 * Validate if a severity level is appropriate for given exploitability and impact
 * Returns true if severity matches or is more severe (higher priority) than calculated severity
 */
export const validateSeverity = (
  severity: Severity,
  exploitability: Exploitability | null | undefined,
  impact: Impact | null | undefined,
): boolean => {
  if (!exploitability || !impact) {
    return true; // Can't validate without both
  }

  const calculated = calculateSeverity(exploitability, impact);
  if (!calculated) {
    return true;
  }

  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  // Severity should match or be more severe (lower number = higher priority) than calculated
  return severityOrder[severity] <= severityOrder[calculated];
};
