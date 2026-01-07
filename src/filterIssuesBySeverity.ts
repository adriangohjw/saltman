import * as core from "@actions/core";
import type { ParsedReview, Severity } from "./types";

interface FilterIssuesBySeverityProps {
  issues: ParsedReview["issues"];
  severityFilter?: Severity[];
}

export const filterIssuesBySeverity = ({
  issues,
  severityFilter,
}: FilterIssuesBySeverityProps): FilterIssuesBySeverityProps["issues"] => {
  // If no filter is specified, return all issues
  if (!severityFilter || severityFilter.length === 0) {
    return issues;
  }

  // Filter issues by severity
  const severitySet = new Set<Severity>(severityFilter);
  const filteredIssues = issues.filter((issue) => severitySet.has(issue.severity));

  // Log filtering information
  core.info(
    `Filtering issues by severity: ${severityFilter.join(", ")}. Found ${filteredIssues.length} of ${issues.length} issues.`,
  );

  return filteredIssues;
};
