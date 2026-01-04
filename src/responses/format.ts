import { SALTMAN_FOOTER } from "./shared";
import type { ParsedReview } from "../types";

interface FormatReviewResponseProps {
  review: ParsedReview;
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
    case "best-practice":
      return "✨ Best Practice";
    default:
      return type;
  }
};

export const formatReviewResponse = ({ review }: FormatReviewResponseProps): string => {
  let output = `## Code Review\n\n`;

  // Summary
  if (review.summary) {
    output += `### Summary\n\n${review.summary}\n\n`;
  }

  // Issues
  if (review.issues && review.issues.length > 0) {
    output += `### Issues Found\n\n`;
    review.issues.forEach((issue, index) => {
      output += `${index + 1}. ${getSeverityEmoji(issue.severity)} **${getTypeLabel(issue.type)}** (${issue.severity})\n`;
      output += `   - ${issue.message}\n`;
      if (issue.line) {
        output += `   - Line: ${issue.line}\n`;
      }
      if (issue.suggestion) {
        output += `   - Suggestion: ${issue.suggestion}\n`;
      }
      output += `\n`;
    });
  } else {
    output += `### Issues Found\n\nNo issues detected! 🎉\n\n`;
  }

  // Positives
  if (review.positives && review.positives.length > 0) {
    output += `### Positive Aspects\n\n`;
    review.positives.forEach((positive) => {
      output += `- ✅ ${positive}\n`;
    });
    output += `\n`;
  }

  output += SALTMAN_FOOTER;
  return output;
};

interface FormatErrorResponseProps {
  errorMessage: string;
}

export const formatErrorResponse = ({ errorMessage }: FormatErrorResponseProps): string => {
  return `## ⚠️ Code Review Error

Failed to generate LLM code review: ${errorMessage}

${SALTMAN_FOOTER}`;
};
