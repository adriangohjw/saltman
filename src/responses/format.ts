import type { ParsedReview, Severity, Exploitability, Impact, SecurityCategory } from "../types";
import { formatAggregatedComment } from "./aggregated";

interface FormatReviewResponseProps {
  review: ParsedReview;
  owner: string;
  repo: string;
  commitShas: string[];
}

// Shared utility functions for formatting
export const getSeverityEmoji = (severity: Severity): string => {
  switch (severity) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    case "info":
      return "ℹ️";
  }
};

export const getSecurityCategoryLabel = (category: SecurityCategory | null | undefined): string => {
  if (!category) return "";
  switch (category) {
    case "injection":
      return "Injection";
    case "authentication":
      return "Authentication";
    case "authorization":
      return "Authorization";
    case "cryptography":
      return "Cryptography";
    case "xss":
      return "XSS";
    case "xxe":
      return "XXE";
    case "deserialization":
      return "Deserialization";
    case "ssrf":
      return "SSRF";
    case "csrf":
      return "CSRF";
    case "idor":
      return "IDOR";
    case "secrets":
      return "Secrets";
    case "config":
      return "Configuration";
    case "logging":
      return "Logging";
    case "api":
      return "API Security";
    case "other":
      return "Security";
  }
};

export const getExploitabilityLabel = (
  exploitability: Exploitability | null | undefined,
): string => {
  if (!exploitability) return "";
  switch (exploitability) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
  }
};

export const getImpactLabel = (impact: Impact | null | undefined): string => {
  if (!impact) return "";
  switch (impact) {
    case "system_compromise":
      return "System Compromise";
    case "data_breach":
      return "Data Breach";
    case "privilege_escalation":
      return "Privilege Escalation";
    case "information_disclosure":
      return "Information Disclosure";
    case "denial_of_service":
      return "Denial of Service";
    case "data_modification":
      return "Data Modification";
    case "minimal":
      return "Minimal";
  }
};

export const getSeverityOrder = (severity: Severity): number => {
  switch (severity) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    case "info":
      return 4;
  }
};

// Separate issues by severity: critical/high for inline, medium/low/info for aggregated
export const separateIssuesBySeverity = (issues: ParsedReview["issues"]) => {
  const criticalHigh: ParsedReview["issues"] = [];
  const mediumLowInfo: ParsedReview["issues"] = [];

  issues.forEach((issue) => {
    if (issue.severity === "critical" || issue.severity === "high") {
      criticalHigh.push(issue);
    } else {
      mediumLowInfo.push(issue);
    }
  });

  return { criticalHigh, mediumLowInfo };
};

// Sort issues by severity only
export const sortIssues = (issues: ParsedReview["issues"]) => {
  return [...issues].sort((a, b) => {
    return getSeverityOrder(a.severity) - getSeverityOrder(b.severity);
  });
};

// Format text with proper paragraph breaks for markdown
export const formatParagraphs = (text: string): string => {
  // Split by double newlines (paragraph breaks) or single newline if followed by content
  // This preserves intentional paragraph breaks while handling various formats
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
};

export const buildFilePermalink = (
  owner: string,
  repo: string,
  headSha: string,
  file: string,
  startLine?: number,
  endLine?: number,
): string => {
  const baseUrl = `https://github.com/${owner}/${repo}/blob/${headSha}/${file}`;
  if (startLine) {
    if (endLine && endLine > startLine) {
      return `${baseUrl}#L${startLine}-L${endLine}`;
    } else {
      return `${baseUrl}#L${startLine}`;
    }
  }
  return baseUrl;
};

// Build metadata line for an issue (severity, category, exploitability, impact)
export const buildMetadataLine = (issue: ParsedReview["issues"][0]): string => {
  const formattedSeverity = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
  const metadataLine: string[] = [`**Severity:** ${formattedSeverity}`];

  if (issue.securityCategory) {
    metadataLine.push(`**Category:** ${getSecurityCategoryLabel(issue.securityCategory)}`);
  }

  if (issue.exploitability) {
    metadataLine.push(`**Exploitability:** ${getExploitabilityLabel(issue.exploitability)}`);
  }

  if (issue.impact) {
    metadataLine.push(`**Impact:** ${getImpactLabel(issue.impact)}`);
  }

  return metadataLine.join(" | ");
};

// Format code snippet consistently
export const formatCodeSnippet = (codeSnippet: string | null | undefined): string => {
  if (!codeSnippet) {
    return "";
  }
  return `\`\`\`\n${codeSnippet}\n\`\`\`\n\n`;
};

interface FormatExplanationProps {
  explanation: string | null | undefined;
}

export const formatExplanation = ({ explanation }: FormatExplanationProps): string => {
  if (!explanation) {
    return "";
  }
  return `<details>\n<summary><strong>💡 Explanation</strong></summary>\n\n${formatParagraphs(explanation)}\n\n</details>\n\n`;
};

interface FormatSolutionProps {
  suggestion: string | null | undefined;
  codeSnippet: string | null | undefined;
}

export const formatSolution = ({ suggestion, codeSnippet }: FormatSolutionProps): string => {
  if (!suggestion) {
    return "";
  }

  const formattedSuggestion = formatParagraphs(suggestion);
  const formattedCode = formatCodeSnippet(codeSnippet);

  let output = `<details>\n<summary><strong>🛠️ Fix</strong></summary>\n\n`;
  output += `${formattedSuggestion}\n\n`;
  if (formattedCode) {
    output += `**Code example:**\n\n${formattedCode}`;
  }
  output += `</details>\n\n`;
  return output;
};

// Legacy function for backward compatibility (returns aggregated format)
export const formatReviewResponse = ({
  review,
  owner,
  repo,
  commitShas,
}: FormatReviewResponseProps): string | null => {
  // Return null if there are no issues
  if (!review.issues || review.issues.length === 0) {
    return null;
  }

  // For backward compatibility, return all issues in aggregated format
  // Since this is legacy and we don't know if there are critical/high issues,
  // we default to false (no critical/high issues) for a generic header
  return formatAggregatedComment({
    issues: review.issues,
    owner,
    repo,
    commitShas,
    hasCriticalHighIssues: false,
  });
};
