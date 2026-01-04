import * as core from "@actions/core";
import * as github from "@actions/github";
import { getContextValues } from "./getContextValues";
import { validateUserAccess } from "./validateUserAccess";
import { validatePullRequestAccess } from "./validatePullRequestAccess";
import { analyzePR } from "./analyzePR";
import { getPullRequestFiles } from "./getPullRequestFiles";
import { validateGithubInputs } from "./validations/githubInputs";

async function run(): Promise<void> {
  try {
    // Get inputs
    const token = core.getInput("github-token", { required: true });
    const openaiApiKey = core.getInput("openai-api-key", { required: true });

    const { token: validatedToken, apiKey: validatedApiKey } = validateGithubInputs({
      token,
      apiKey: openaiApiKey,
    });

    // Initialize GitHub client
    const octokit = github.getOctokit(validatedToken);
    const context = github.context;

    const { prNumber, username } = getContextValues({ context });

    const owner = context.repo.owner;
    const repo = context.repo.repo;

    await validateUserAccess({ octokit, owner, repo, username });
    await validatePullRequestAccess({ octokit, owner, repo, prNumber });

    const files = await getPullRequestFiles({ octokit, owner, repo, prNumber });

    const analysis = await analyzePR({ files, apiKey: validatedApiKey });

    // Post comment to PR
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: analysis,
    });
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
