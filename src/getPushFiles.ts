import { getOctokit } from "@actions/github";
import type { FileChange } from "./types";

interface GetPushFilesProps {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  commitSha: string;
  baseSha?: string;
}

export interface GetPushFilesResult {
  files: FileChange[];
  commitShas: string[];
}

export const getPushFiles = async ({
  octokit,
  owner,
  repo,
  commitSha,
  baseSha,
}: GetPushFilesProps): Promise<GetPushFilesResult> => {
  try {
    // Determine the base commit for comparison
    // baseSha may be unavailable in edge cases:
    // - Initial commit on a branch (before is all zeros)
    // - Empty repository (no previous commit)
    // - Force push with history rewrite (before commit may not exist)
    // If there's no valid base commit, skip analysis (nothing to compare against)
    if (!baseSha || baseSha === "0000000000000000000000000000000000000000") {
      // No base commit available - this is likely an initial commit
      // Return empty array to skip analysis
      return { files: [], commitShas: [] };
    }

    const response = await octokit.rest.repos.compareCommits({
      owner,
      repo,
      base: baseSha,
      head: commitSha,
    });

    // Transform the comparison result to match the PR files format
    const files =
      response.data.files?.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch || "",
      })) || [];

    // Extract all commit SHAs from the comparison (in chronological order)
    const commitShas = response.data.commits?.map((commit) => commit.sha) || [];

    return { files, commitShas };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Resource not accessible by integration")
    ) {
      throw new Error(
        "Permission denied: The GitHub token does not have sufficient permissions to compare commits. " +
          "Please ensure the workflow has 'contents: read' permission.",
      );
    }
    throw error;
  }
};
