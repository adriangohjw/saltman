import { getSaltmanFooter } from "./shared";
import { getHeadSha } from "../utils/getHeadSha";
import type { ParsedReview } from "../types";
import {
  getSeverityEmoji,
  sortIssues,
  formatParagraphs,
  buildFilePermalink,
  buildMetadataLine,
  formatExplanation,
  formatSolution,
} from "./format";

interface FormatAggregatedCommentProps {
  issues: ParsedReview["issues"];
  owner: string;
  repo: string;
  commitShas: string[];
  hasCriticalHighIssues: boolean;
}

// Format aggregated comment for medium/low/info issues
export const formatAggregatedComment = ({
  issues,
  owner,
  repo,
  commitShas,
  hasCriticalHighIssues,
}: FormatAggregatedCommentProps): string | null => {
  if (issues.length === 0) {
    return null;
  }

  const headSha = getHeadSha(commitShas);

  let output = buildAggregatedHeader({ hasCriticalHighIssues });

  // Sort issues by severity
  const sortedIssues = sortIssues(issues);

  sortedIssues.forEach((issue, index) => {
    output += `### ${index + 1}. ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;

    // Build metadata line
    output += `${buildMetadataLine(issue)}\n\n`;

    // Brief description
    if (issue.description) {
      output += `${formatParagraphs(issue.description)}\n\n`;
    }

    // File and line reference with permalink
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

    output += formatExplanation({ explanation: issue.explanation });

    output += formatSolution({ suggestion: issue.suggestion, codeSnippet: issue.codeSnippet });
  });

  output += getSaltmanFooter({ owner, repo, commitShas });

  return output;
};

const buildAggregatedHeader = ({
  hasCriticalHighIssues,
}: {
  hasCriticalHighIssues: boolean;
}): string => {
  const title = hasCriticalHighIssues
    ? "## Saltman Code Review - Additional Findings"
    : "## Saltman Code Review";

  return `${title}\n\n`;
};
