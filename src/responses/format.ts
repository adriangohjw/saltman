import { getSaltmanFooter } from "./shared";
import type { ParsedReview } from "../types";

interface FormatReviewResponseProps {
  review: ParsedReview;
  owner: string;
  repo: string;
  headSha: string;
}

const getSeverityEmoji = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
};

const getTypeLabel = (type: string): string => {
  switch (type.toLowerCase()) {
    case "bug":
      return "🐛 Bug";
    case "security":
      return "🔒 Security";
    case "performance":
      return "⚡ Performance";
    default:
      return type;
  }
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
    review.issues.forEach((issue, index) => {
      output += `### ${index + 1}. ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;
      output += `**Type:** ${getTypeLabel(issue.type)} | **Severity:** ${issue.severity}\n\n`;

      // File and line reference with permalink (GitHub will auto-embed code snippet)
      if (issue.location?.file) {
        const { file, startLine, endLine } = issue.location;
        const permalink = buildFilePermalink(owner, repo, headSha, file, startLine, endLine);
        if (startLine) {
          const displayLine = formatLineForDisplay(startLine, endLine);
          output += `**Location:** \`${file}:${displayLine}\`\n\n${permalink}\n\n`;
        } else {
          output += `**Location:** \`${file}\`\n\n${permalink}\n\n`;
        }
      }

      // Brief description (visible by default)
      if (issue.description) {
        output += `${issue.description}\n\n`;
      }

      // Detailed explanation in dropdown
      if (issue.explanation) {
        output += `<details>\n<summary><strong>Explanation</strong></summary>\n\n`;
        output += `${issue.explanation}\n\n`;
        output += `</details>\n\n`;
      }

      // Solution in dropdown
      if (issue.suggestion) {
        output += `<details>\n<summary><strong>Solution</strong></summary>\n\n`;
        output += `${issue.suggestion}\n\n`;
        output += `</details>\n\n`;
      }
    });
  } else {
    output += `No issues detected! 🎉\n\n`;
  }

  output += getSaltmanFooter(owner, repo, headSha);
  return output;
};

interface FormatErrorResponseProps {
  errorMessage: string;
  owner: string;
  repo: string;
  headSha: string;
}

export const formatErrorResponse = ({
  errorMessage,
  owner,
  repo,
  headSha,
}: FormatErrorResponseProps): string => {
  return `## ⚠️ Saltman Code Review Error

Failed to generate LLM code review: ${errorMessage}

${getSaltmanFooter(owner, repo, headSha)}`;
};
