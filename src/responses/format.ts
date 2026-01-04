import { SALTMAN_FOOTER } from "./shared";
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
  line?: string | null,
): string => {
  const baseUrl = `https://github.com/${owner}/${repo}/blob/${headSha}/${file}`;
  if (line) {
    // Try to parse line number - could be a single number or range
    const lineNum = line.match(/^\d+/)?.[0];
    if (lineNum) {
      return `${baseUrl}#L${lineNum}`;
    }
  }
  return baseUrl;
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
      output += `${issue.message}\n\n`;

      // File and line reference with permalink
      if (issue.file) {
        const permalink = buildFilePermalink(owner, repo, headSha, issue.file, issue.line);
        if (issue.line) {
          output += `**Location:** [\`${issue.file}:${issue.line}\`](${permalink})\n\n`;
        } else {
          output += `**Location:** [\`${issue.file}\`](${permalink})\n\n`;
        }
      } else if (issue.line) {
        output += `**Line:** ${issue.line}\n\n`;
      }

      // Suggestion with better formatting
      if (issue.suggestion) {
        output += `**Suggestion:**\n\n${issue.suggestion}\n\n`;
      }
    });
  } else {
    output += `No issues detected! 🎉\n\n`;
  }

  output += SALTMAN_FOOTER;
  return output;
};

interface FormatErrorResponseProps {
  errorMessage: string;
}

export const formatErrorResponse = ({ errorMessage }: FormatErrorResponseProps): string => {
  return `## ⚠️ Saltman Code Review Error

Failed to generate LLM code review: ${errorMessage}

${SALTMAN_FOOTER}`;
};
