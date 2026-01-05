import * as core from "@actions/core";
import * as github from "@actions/github";
import { getContextValues } from "./getContextValues";
import { validateUserAccess } from "./validations/validateUserAccess";
import { validatePullRequestAccess } from "./validations/validatePullRequestAccess";
import { analyzePR } from "./analyzePR";
import { getPullRequestFiles } from "./getPullRequestFiles";
import { validateGithubInputs } from "./validations/githubInputs";
import { getSaltmanFooter } from "./responses/shared";

async function run(): Promise<void> {
  try {
    // Get inputs
    const inputToken = core.getInput("github-token", { required: true });
    const inputOpenaiApiKey = core.getInput("openai-api-key", { required: true });
    const inputPostCommentWhenNoIssues = core.getInput("post-comment-when-no-issues");

    const { token, apiKey, postCommentWhenNoIssues } = validateGithubInputs({
      token: inputToken,
      apiKey: inputOpenaiApiKey,
      postCommentWhenNoIssues: inputPostCommentWhenNoIssues,
    });

    // Initialize GitHub client
    const octokit = github.getOctokit(token);
    const context = github.context;

    const { prNumber, username } = getContextValues({ context });

    const owner = context.repo.owner;
    const repo = context.repo.repo;

    await validateUserAccess({ octokit, owner, repo, username });
    await validatePullRequestAccess({ octokit, owner, repo, prNumber });

    // Get PR details to get head SHA for permalinks
    const prResponse = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    const headSha = prResponse.data.head.sha;

    const files = await getPullRequestFiles({ octokit, owner, repo, prNumber });

    const analysis = await analyzePR({ files, apiKey, owner, repo, headSha });

    // If no analysis was performed (e.g., no text files), skip posting comments
    if (!analysis) {
      return;
    }

    // Post inline comments for critical/high issues
    if (analysis.inlineComments.length > 0) {
      // Create individual review comments for critical/high issues
      // GitHub API requires the line to be in the diff, so we try inline first and fall back to regular comments
      for (const comment of analysis.inlineComments) {
        try {
          await octokit.rest.pulls.createReviewComment({
            owner,
            repo,
            pull_number: prNumber,
            commit_id: headSha,
            path: comment.path,
            line: comment.line,
            body: comment.body,
          });
        } catch (error) {
          // If inline comment fails (e.g., line number not in diff), skip it
          // This can happen if the LLM provides a line number that's not in the changed lines
          // We skip rather than fall back to avoid posting potentially incorrect line references
          console.warn(
            `Skipping inline comment for ${comment.path}:${comment.line}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Post aggregated comment for medium/low/info issues
    if (analysis.aggregatedComment) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: analysis.aggregatedComment,
      });
    }

    // Post "no issues" comment if enabled and no issues found
    if (!analysis.hasIssues && postCommentWhenNoIssues) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `## Saltman Code Review\n\nNo issues detected! 🎉\n\n${getSaltmanFooter({ owner, repo, commitSha: headSha })}`,
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error occurred");
    }
  }
}

// Execute the action
run();
