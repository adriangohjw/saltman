import { getSaltmanFooter } from "./shared";
import type { ParsedReview } from "../types";
import {
  getSeverityEmoji,
  formatParagraphs,
  buildMetadataLine,
  formatExplanation,
  formatSolution,
} from "./format";

export interface InlineComment {
  path: string;
  line: number;
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
      inlineComments.push({
        path: issue.location.file,
        line: issue.location.startLine,
        body: formatInlineComment({ issue, owner, repo, headSha }),
      });
    }
  });

  return inlineComments;
};
