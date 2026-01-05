import { getSaltmanFooter } from "./shared";
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
  headSha: string;
  hasCriticalHighIssues: boolean;
}

// Format aggregated comment for medium/low/info issues
export const formatAggregatedComment = ({
  issues,
  owner,
  repo,
  headSha,
  hasCriticalHighIssues,
}: FormatAggregatedCommentProps): string | null => {
  if (issues.length === 0) {
    return null;
  }

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

  output += getSaltmanFooter({ owner, repo, commitSha: headSha });

  return output;
};

// Build header for aggregated comment
const buildAggregatedHeader = ({
  hasCriticalHighIssues,
}: {
  hasCriticalHighIssues: boolean;
}): string => {
  const headers = {
    withCriticalHigh: {
      title: `## Saltman Code Review - Additional Findings`,
      subtitle: `*Medium, low, and informational issues:*`,
    },
    withoutCriticalHigh: {
      title: `## Saltman Code Review`,
      subtitle: `*Findings:*`,
    },
  };

  const header = hasCriticalHighIssues ? headers.withCriticalHigh : headers.withoutCriticalHigh;
  return `${header.title}\n\n${header.subtitle}\n\n`;
};
