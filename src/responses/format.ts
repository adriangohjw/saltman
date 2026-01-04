import { getSaltmanFooter } from "./shared";
import type {
  ParsedReview,
  Severity,
  IssueType,
  Exploitability,
  Impact,
  SecurityCategory,
} from "../types";
import { SEVERITY_VALUES } from "../types";

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

const getTypeLabel = (type: IssueType): string => {
  switch (type) {
    case "vulnerability":
      return "🔴 Vulnerability";
    case "misconfiguration":
      return "🟠 Misconfiguration";
    case "best_practice":
      return "💡 Best Practice";
  }
};

const getSecurityCategoryLabel = (category: SecurityCategory | null | undefined): string => {
  if (!category) return "";
  switch (category) {
    case "injection":
      return "💉 Injection";
    case "authentication":
      return "🔐 Authentication";
    case "authorization":
      return "🛡️ Authorization";
    case "cryptography":
      return "🔑 Cryptography";
    case "xss":
      return "⚠️ XSS";
    case "xxe":
      return "📄 XXE";
    case "deserialization":
      return "🔄 Deserialization";
    case "ssrf":
      return "🌐 SSRF";
    case "csrf":
      return "🔄 CSRF";
    case "idor":
      return "🔓 IDOR";
    case "secrets":
      return "🔑 Secrets";
    case "config":
      return "⚙️ Configuration";
    case "logging":
      return "📝 Logging";
    case "api":
      return "🔌 API Security";
    case "other":
      return "🔒 Security";
  }
};

const getExploitabilityLabel = (exploitability: Exploitability | null | undefined): string => {
  if (!exploitability) return "";
  switch (exploitability) {
    case "easy":
      return "🟢 Easy";
    case "medium":
      return "🟡 Medium";
    case "hard":
      return "🟠 Hard";
  }
};

const getImpactLabel = (impact: Impact | null | undefined): string => {
  if (!impact) return "";
  switch (impact) {
    case "system_compromise":
      return "🔴 System Compromise";
    case "data_breach":
      return "🟠 Data Breach";
    case "privilege_escalation":
      return "🟡 Privilege Escalation";
    case "information_disclosure":
      return "🟡 Information Disclosure";
    case "denial_of_service":
      return "🟠 Denial of Service";
    case "data_modification":
      return "🟡 Data Modification";
    case "minimal":
      return "🟢 Minimal";
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

const getTypeOrder = (type: IssueType): number => {
  switch (type) {
    case "vulnerability":
      return 0;
    case "misconfiguration":
      return 1;
    case "best_practice":
      return 2;
  }
};

// Sort issues: vulnerability first (by severity), then misconfiguration, then best_practice
const sortIssues = (issues: ParsedReview["issues"]) => {
  return [...issues].sort((a, b) => {
    const typeDiff = getTypeOrder(a.type) - getTypeOrder(b.type);
    if (typeDiff !== 0) return typeDiff;
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

// Format line numbers for display (e.g., "42" or "42-45")
const formatLineForDisplay = (startLine: number, endLine?: number): string => {
  if (endLine && endLine > startLine) {
    return `${startLine}-${endLine}`;
  }
  return `${startLine}`;
};

export const formatReviewResponse = ({
  review,
  owner,
  repo,
  headSha,
}: FormatReviewResponseProps): string => {
  let output = `## Saltman Code Review\n\n`;

  // Issues
  if (review.issues && review.issues.length > 0) {
    // Sort issues: security first (by severity), then bugs, then performance
    const sortedIssues = sortIssues(review.issues);

    // Calculate security summary
    const securityIssues = sortedIssues.filter(
      (issue) => issue.type === "vulnerability" || issue.type === "misconfiguration",
    );
    const securityBySeverity = {
      critical: securityIssues.filter((i) => i.severity === "critical").length,
      high: securityIssues.filter((i) => i.severity === "high").length,
      medium: securityIssues.filter((i) => i.severity === "medium").length,
      low: securityIssues.filter((i) => i.severity === "low").length,
      info: securityIssues.filter((i) => i.severity === "info").length,
    };

    // Add security summary if there are security issues
    if (securityIssues.length > 0) {
      output += `### 🔒 Security Summary\n\n`;
      const severityCounts: string[] = [];

      // Use exhaustive switch for severity counts
      for (const severity of SEVERITY_VALUES) {
        const count = securityBySeverity[severity];
        if (count > 0) {
          const emoji = getSeverityEmoji(severity);
          const label = severity.charAt(0).toUpperCase() + severity.slice(1);
          severityCounts.push(`${emoji} **${label}:** ${count}`);
        }
      }

      output += `${severityCounts.join(" | ")}\n\n`;
      output += `**Total Security Issues:** ${securityIssues.length}\n\n`;
      if (securityBySeverity.critical > 0 || securityBySeverity.high > 0) {
        output += `⚠️ **Action Required:** Please address critical and high severity issues immediately.\n\n`;
      }
      output += `---\n\n`;
    }

    sortedIssues.forEach((issue, index) => {
      output += `### ${index + 1}. ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;

      // Build type and severity line
      const typeSeverityLine: string[] = [
        `**Type:** ${getTypeLabel(issue.type)}`,
        `**Severity:** ${issue.severity}`,
      ];

      // Add security category and metadata based on issue type
      switch (issue.type) {
        case "vulnerability":
        case "misconfiguration":
          if (issue.securityCategory) {
            typeSeverityLine.push(
              `**Category:** ${getSecurityCategoryLabel(issue.securityCategory)}`,
            );
          }
          break;
        case "best_practice":
          // No category for best practices
          break;
      }

      output += `${typeSeverityLine.join(" | ")}\n\n`;

      // Add security metadata for vulnerability issues
      switch (issue.type) {
        case "vulnerability": {
          const securityMetadata: string[] = [];
          if (issue.exploitability) {
            securityMetadata.push(
              `**Exploitability:** ${getExploitabilityLabel(issue.exploitability)}`,
            );
          }
          if (issue.impact) {
            securityMetadata.push(`**Impact:** ${getImpactLabel(issue.impact)}`);
          }
          if (securityMetadata.length > 0) {
            output += `${securityMetadata.join(" | ")}\n\n`;
          }
          break;
        }
        case "misconfiguration":
        case "best_practice":
          // No exploitability/impact metadata for these types
          break;
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
        if (startLine) {
          const displayLine = formatLineForDisplay(startLine, endLine ?? undefined);
          output += `**Location:** \`${file}:${displayLine}\`\n\n${permalink}\n\n`;
        } else {
          output += `**Location:** \`${file}\`\n\n${permalink}\n\n`;
        }
      }

      // Brief description (visible by default)
      if (issue.description) {
        output += `${formatParagraphs(issue.description)}\n\n`;
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
  } else {
    output += `No issues detected! 🎉\n\n`;
  }

  output += getSaltmanFooter(owner, repo, headSha);
  return output;
};
