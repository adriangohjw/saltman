import { getSaltmanFooter } from "./shared";
import type { ParsedReview } from "../types";
import {
  getSeverityEmoji,
  formatParagraphs,
  buildMetadataLine,
  formatExplanation,
  formatSolution,
} from "./format";

// Inline comment (always uses startLine and endLine, even for single-line issues)
export interface InlineComment {
  path: string;
  startLine: number;
  endLine: number;
  body: string;
}

interface FormatInlineCommentProps {
  issue: ParsedReview["issues"][0];
  owner: string;
  repo: string;
  headSha: string;
}

// Format a single issue for inline comment (concise and actionable)
const formatInlineComment = ({ issue, owner, repo, headSha }: FormatInlineCommentProps): string => {
  let output = `### ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;

  // Build metadata line
  output += `${buildMetadataLine(issue)}\n\n`;

  // Description (always visible, keep it concise)
  if (issue.description) {
    output += `${formatParagraphs(issue.description)}\n\n`;
  }

  output += formatExplanation({ explanation: issue.explanation });

  output += formatSolution({ suggestion: issue.suggestion, codeSnippet: issue.codeSnippet });

  output += getSaltmanFooter({ owner, repo, commitSha: headSha });

  return output;
};

interface GenerateInlineCommentsProps {
  issues: ParsedReview["issues"];
  owner: string;
  repo: string;
  headSha: string;
}

// Generate inline comments for critical/high issues
export const generateInlineComments = ({
  issues,
  owner,
  repo,
  headSha,
}: GenerateInlineCommentsProps): InlineComment[] => {
  const inlineComments: InlineComment[] = [];

  issues.forEach((issue) => {
    // Only create inline comments for issues with valid location and line numbers
    if (issue.location?.file && issue.location.startLine) {
      // Always use startLine and endLine (use startLine for endLine if not provided)
      const endLine =
        issue.location.endLine && issue.location.endLine > issue.location.startLine
          ? issue.location.endLine
          : issue.location.startLine;

      inlineComments.push({
        path: issue.location.file,
        startLine: issue.location.startLine,
        endLine,
        body: formatInlineComment({ issue, owner, repo, headSha }),
      });
    }
  });

  return inlineComments;
};
