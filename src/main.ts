import * as core from "@actions/core";
import * as github from "@actions/github";
import { getContextValues } from "./getContextValues";
import { validateUserAccess } from "./validations/validateUserAccess";
import { validatePullRequestAccess } from "./validations/validatePullRequestAccess";
import { analyzePR } from "./analyzePR";
import { getPullRequestFiles } from "./getPullRequestFiles";
import { validateGithubInputs } from "./validations/githubInputs";

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput("github-token", { required: true });
    const openaiApiKey = core.getInput("openai-api-key", { required: true });
    const postComment = core.getInput("post-comment");

    const {
      token: validatedToken,
      apiKey: validatedApiKey,
      postComment: validatedPostComment,
    } = validateGithubInputs({
      token,
      apiKey: openaiApiKey,
      postComment,
    });

    // Initialize GitHub client
    const octokit = github.getOctokit(validatedToken);
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

    const analysis = await analyzePR({ files, apiKey: validatedApiKey, owner, repo, headSha });

    // Post comment to PR only if post-comment is explicitly set to true
    if (validatedPostComment === true) {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: analysis,
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
