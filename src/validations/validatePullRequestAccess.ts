import { getOctokit } from "@actions/github";

interface ValidatePullRequestAccessProps {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  prNumber: number;
}

export const validatePullRequestAccess = async ({
  octokit,
  owner,
  repo,
  prNumber,
}: ValidatePullRequestAccessProps) => {
  try {
    await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Resource not accessible by integration")
    ) {
      throw new Error(
        "Permission denied: The GitHub token does not have sufficient permissions. " +
          "Please ensure the workflow has 'pull-requests: read' permission. " +
          "Add this to your workflow:\n" +
          "permissions:\n" +
          "  pull-requests: write\n" +
          "  contents: read\n" +
          "  issues: write",
      );
    }
    throw error;
  }
};
