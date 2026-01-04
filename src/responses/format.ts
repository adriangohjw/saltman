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

      // Brief description (visible by default)
      if (issue.description) {
        output += `${formatParagraphs(issue.description)}\n\n`;
      }

      // File and line reference with permalink (GitHub will auto-embed code snippet)
      if (issue.location?.file) {
        const { file, startLine, endLine } = issue.location;
        if (startLine) {
          const lineRange =
            endLine && endLine > startLine ? `L${startLine}-L${endLine}` : `L${startLine}`;
          output += `<!-- LOCATIONS START\n${file}#${lineRange}\nLOCATIONS END -->\n\n`;
        } else {
          output += `<!-- LOCATIONS START\n${file}\nLOCATIONS END -->\n\n`;
        }
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
