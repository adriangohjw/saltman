import type { ParsedReview } from "../types";
import {
  SEVERITY_VALUES,
  EXPLOITABILITY_VALUES,
  IMPACT_VALUES,
  SECURITY_CATEGORY_VALUES,
} from "../types";

/**
 * Sanitizes an enum field value by handling arrays and invalid strings.
 *
 * @param value - The value to sanitize
 * @param validValues - Array of valid enum values
 * @param fieldName - Name of the field (for logging)
 * @param issueTitle - Title of the issue (for logging)
 * @param defaultValue - Default value to use if invalid
 * @returns Sanitized value
 */
function sanitizeEnumField<T extends string>(
  value: any,
  validValues: readonly T[],
  fieldName: string,
  issueTitle: string,
  defaultValue: T
): T {
  // If the value is undefined or null, return as-is (optional fields)
  if (value === undefined || value === null) {
    return value;
  }

  // If the value is an array, log warning and return default
  if (Array.isArray(value)) {
    console.warn(
      `⚠️  Invalid ${fieldName} (array) in issue "${issueTitle}": defaulting to "${defaultValue}"`
    );
    return defaultValue;
  }

  // If the value is a string but not in the valid values, default
  if (typeof value === "string" && !validValues.includes(value as T)) {
    console.warn(
      `⚠️  Invalid ${fieldName} "${value}" in issue "${issueTitle}": defaulting to "${defaultValue}"`
    );
    return defaultValue;
  }

  return value as T;
}

/**
 * Sanitizes a parsed review response from an LLM to fix common validation errors.
 *
 * This handles cases where models without proper structured output support
 * (e.g., GLM-4.7) return invalid values for enum fields.
 *
 * Known issues handled:
 * - All enum fields (severity, exploitability, impact, securityCategory) can be arrays
 * - All enum fields can be invalid strings not in the allowed enum
 *
 * @param parsed - The parsed review response from the LLM
 * @returns Sanitized review response with valid enum values
 */
export function sanitizeReviewResponse(parsed: any): ParsedReview {
  if (!parsed || !parsed.issues || !Array.isArray(parsed.issues)) {
    return parsed;
  }

  return {
    ...parsed,
    issues: parsed.issues.map((issue: any) => {
      const sanitizedIssue = { ...issue };

      // Sanitize severity (required field)
      if (sanitizedIssue.severity !== undefined && sanitizedIssue.severity !== null) {
        sanitizedIssue.severity = sanitizeEnumField(
          sanitizedIssue.severity,
          SEVERITY_VALUES,
          "severity",
          issue.title,
          "medium" // Default severity
        );
      }

      // Sanitize exploitability (optional field)
      if (sanitizedIssue.exploitability !== undefined && sanitizedIssue.exploitability !== null) {
        sanitizedIssue.exploitability = sanitizeEnumField(
          sanitizedIssue.exploitability,
          EXPLOITABILITY_VALUES,
          "exploitability",
          issue.title,
          "medium" // Default exploitability
        );
      }

      // Sanitize impact (optional field)
      if (sanitizedIssue.impact !== undefined && sanitizedIssue.impact !== null) {
        sanitizedIssue.impact = sanitizeEnumField(
          sanitizedIssue.impact,
          IMPACT_VALUES,
          "impact",
          issue.title,
          "minimal" // Default impact
        );
      }

      // Sanitize securityCategory (optional field)
      if (sanitizedIssue.securityCategory !== undefined && sanitizedIssue.securityCategory !== null) {
        sanitizedIssue.securityCategory = sanitizeEnumField(
          sanitizedIssue.securityCategory,
          SECURITY_CATEGORY_VALUES,
          "securityCategory",
          issue.title,
          "other" // Default security category
        );
      }

      return sanitizedIssue;
    }),
  };
}
