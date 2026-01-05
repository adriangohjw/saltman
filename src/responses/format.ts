import { getSaltmanFooter } from "./shared";
import type { ParsedReview, Severity, Exploitability, Impact, SecurityCategory } from "../types";

interface FormatReviewResponseProps {
  review: ParsedReview;
  owner: string;
  repo: string;
  headSha: string;
}

const getSeverityEmoji = (severity: Severity): string => {
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

const getSecurityCategoryLabel = (category: SecurityCategory | null | undefined): string => {
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

const getExploitabilityLabel = (exploitability: Exploitability | null | undefined): string => {
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

const getImpactLabel = (impact: Impact | null | undefined): string => {
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

const getSeverityOrder = (severity: Severity): number => {
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

// Sort issues by severity only
const sortIssues = (issues: ParsedReview["issues"]) => {
  return [...issues].sort((a, b) => {
    return getSeverityOrder(a.severity) - getSeverityOrder(b.severity);
  });
};

// Format text with proper paragraph breaks for markdown
const formatParagraphs = (text: string): string => {
  // Split by double newlines (paragraph breaks) or single newline if followed by content
  // This preserves intentional paragraph breaks while handling various formats
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .join("\n\n");
};

const buildFilePermalink = (
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

export const formatReviewResponse = ({
  review,
  owner,
  repo,
  headSha,
}: FormatReviewResponseProps): string | null => {
  // Return null if there are no issues
  if (!review.issues || review.issues.length === 0) {
    return null;
  }

  let output = `## Saltman Code Review\n\n`;

  // Sort issues by severity
  const sortedIssues = sortIssues(review.issues);

  sortedIssues.forEach((issue, index) => {
    output += `### ${index + 1}. ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;

    // Build metadata line combining severity, category, exploitability, and impact
    const formattedSeverity = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
    const metadataLine: string[] = [`**Severity:** ${formattedSeverity}`];

    // Add security category if present
    if (issue.securityCategory) {
      metadataLine.push(`**Category:** ${getSecurityCategoryLabel(issue.securityCategory)}`);
    }

    // Add exploitability and impact if present (only for vulnerabilities)
    if (issue.exploitability) {
      metadataLine.push(`**Exploitability:** ${getExploitabilityLabel(issue.exploitability)}`);
    }
    if (issue.impact) {
      metadataLine.push(`**Impact:** ${getImpactLabel(issue.impact)}`);
    }

    output += `${metadataLine.join(" | ")}\n\n`;

    // Brief description (visible by default)
    if (issue.description) {
      output += `${formatParagraphs(issue.description)}\n\n`;
    }

    // File and line reference with permalink (GitHub will auto-embed code snippet)
    if (issue.location?.file) {
      const { file, startLine, endLine } = issue.location;
      const permalink = buildFilePermalink(
        owner,
        repo,
        headSha,
        file,
        startLine ?? undefined,
        endLine ?? undefined,
      );
      output += `${permalink}\n\n`;
    }

    // Detailed explanation in dropdown
    if (issue.explanation) {
      output += `<details>\n<summary><strong>Explanation</strong></summary>\n\n`;
      output += `${formatParagraphs(issue.explanation)}\n\n`;
      output += `</details>\n\n`;
    }

    // Solution in dropdown
    if (issue.suggestion) {
      output += `<details>\n<summary><strong>Solution</strong></summary>\n\n`;
      output += `${formatParagraphs(issue.suggestion)}\n\n`;

      // Code snippet (only if provided and relevant)
      if (issue.codeSnippet) {
        output += `**Code example:**\n\n\`\`\`\n${issue.codeSnippet}\n\`\`\`\n\n`;
      }

      output += `</details>\n\n`;
    }
  });

  output += getSaltmanFooter({ owner, repo, commitSha: headSha });
  return output;
};
