import { getSaltmanFooter } from "./shared";
import { getHeadSha } from "../utils/getHeadSha";
import type { ParsedReview } from "../types";
import {
  getSeverityEmoji,
  formatParagraphs,
  buildFilePermalink,
  buildMetadataLine,
  formatExplanation,
  formatSolution,
} from "./format";

// Format a single issue for a GitHub issue body (used for push events)
export const formatSingleIssueForIssue = ({
  issue,
  owner,
  repo,
  commitShas,
}: {
  issue: ParsedReview["issues"][0];
  owner: string;
  repo: string;
  commitShas: string[];
}): string => {
  const headSha = getHeadSha(commitShas);

  // Add Saltman label to the title, which can be used for dedeuplication of issues
  let output = `## ${getSeverityEmoji(issue.severity)} ${issue.title}\n\n`;

  // Build metadata line
  output += `${buildMetadataLine(issue)}\n\n`;

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
    output += `**Location:** ${permalink}\n\n`;
  }

  output += formatExplanation({ explanation: issue.explanation });

  output += formatSolution({ suggestion: issue.suggestion, codeSnippet: issue.codeSnippet });

  output += getSaltmanFooter({
    owner,
    repo,
    commitShas,
  });

  return output;
};
