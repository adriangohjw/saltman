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

    // Always post comment when issues are detected, or when no issues are detected and postCommentWhenNoIssues is enabled
    if (analysis !== null) {
      // Issues detected - always post
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: analysis,
      });
    } else if (postCommentWhenNoIssues) {
      // No issues detected - only post if postCommentWhenNoIssues is enabled
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
