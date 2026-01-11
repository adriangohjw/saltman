import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import Anthropic from "@anthropic-ai/sdk";
import * as core from "@actions/core";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { separateIssuesBySeverity } from "./responses/format";
import { generateInlineComments, type InlineComment } from "./responses/inline";
import { formatAggregatedComment } from "./responses/aggregated";
import type { AnalyzePRProps, FileChange, ParsedReview } from "./types";
import { ReviewResponseSchema } from "./types";
import { buildAnalysisPrompt, getSystemMessage } from "./prompts";
import type { GithubInputs } from "./validations/githubInputs";
import { getModelWithDefault } from "./validations/githubInputs";
import { estimateMaxTokens } from "./utils/estimateMaxTokens";
import { filterIssuesBySeverity } from "./filterIssuesBySeverity";
import { sanitizeReviewResponse } from "./utils/sanitizeReviewResponse";

interface AnalyzePRWithContextProps
  extends AnalyzePRProps,
    Pick<
      GithubInputs,
      | "provider"
      | "baseUrl"
      | "model"
      | "pingUsers"
      | "severityFilter"
      | "structuredOutputs"
    > {
  owner: string;
  repo: string;
  headSha: string;
}

export interface AnalysisResult {
  inlineComments: InlineComment[];
  aggregatedComment: string | null;
  allIssues: ParsedReview["issues"];
}

const callOpenAI = async (
  apiKey: string,
  model: string,
  diff: string
): Promise<ParsedReview> => {
  core.info(`📡 Calling OpenAI API with model: ${model}`);
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const response = await openai.responses.parse({
    model: model,
    input: [
      {
        role: "system",
        content: getSystemMessage(),
      },
      {
        role: "user",
        content: buildAnalysisPrompt(diff),
      },
    ],
    text: {
      format: zodTextFormat(ReviewResponseSchema, "code_review_response"),
    },
  });

  // Check if output_parsed is null (can happen when model refuses or parsing fails)
  if (response.output_parsed === null) {
    throw new Error(
      "Model response could not be parsed. The model may have refused to respond or the response format was invalid."
    );
  }

  return response.output_parsed as ParsedReview;
};

const callAnthropic = async (
  apiKey: string,
  model: string,
  diff: string
): Promise<ParsedReview> => {
  core.info(`📡 Calling Anthropic API with model: ${model}`);
  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const response = await anthropic.beta.messages.create({
    model: model,
    max_tokens: estimateMaxTokens({ diff, defaultMax: 4096 }),
    betas: ["structured-outputs-2025-11-13"],
    system: getSystemMessage(),
    messages: [
      {
        role: "user",
        content: buildAnalysisPrompt(diff),
      },
    ],
    output_format: betaZodOutputFormat(ReviewResponseSchema),
  });

  // Parse the JSON response from the text content
  const responseText =
    response.content[0]?.type === "text" ? response.content[0].text : null;
  if (!responseText) {
    throw new Error(
      "Model response could not be parsed. The model may have refused to respond or the response format was invalid."
    );
  }

  // Parse and validate the JSON response using the Zod schema
  const parsed = JSON.parse(responseText);
  return ReviewResponseSchema.parse(parsed);
};

const callOpenAICompatibleStructured = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  diff: string
): Promise<ParsedReview> => {
  core.info(
    `📡 Calling OpenAI-compatible API at ${baseUrl} with model: ${model}`
  );
  const openaiCompatible = createOpenAICompatible({
    name: "openai-compatible",
    baseURL: baseUrl,
    apiKey: apiKey,
    supportsStructuredOutputs: true,
  });

  const { object } = await generateObject({
    model: openaiCompatible.chatModel(model),
    system: getSystemMessage(),
    prompt: buildAnalysisPrompt(diff),
    schema: ReviewResponseSchema,
  });

  if (!object) {
    throw new Error(
      "Model response could not be parsed. The model may have refused to respond or the response format was invalid."
    );
  }

  return object as ParsedReview;
};

const callOpenAICompatibleNonStructured = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  diff: string
): Promise<ParsedReview> => {
  core.info(
    `📡 Calling OpenAI-compatible API at ${baseUrl} with model: ${model} (JSON mode)`
  );
  core.info(`🔄 Using native OpenAI SDK with JSON mode`);

  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  });

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: getSystemMessage({ includeVerboseJsonInstructions: true }),
      },
      {
        role: "user",
        content: buildAnalysisPrompt(diff),
      },
    ],
    response_format: { type: "json_object" },
  });

  const content =
    response.choices[0]?.message?.content ||
    (response.choices[0]?.message as any)?.reasoning_content;
  if (!content) {
    throw new Error("Model response was empty or invalid.");
  }

  const parsed = JSON.parse(content);
  // Sanitize the response to fix invalid enum values (e.g., securityCategory arrays)
  const sanitized = sanitizeReviewResponse(parsed);
  return ReviewResponseSchema.parse(sanitized);
};

const callOpenAICompatible = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  diff: string,
  structuredOutputs: boolean
): Promise<ParsedReview> => {
  if (structuredOutputs) {
    return callOpenAICompatibleStructured(apiKey, baseUrl, model, diff);
  } else {
    return callOpenAICompatibleNonStructured(apiKey, baseUrl, model, diff);
  }
};

export const analyzePR = async ({
  files,
  apiKey,
  owner,
  repo,
  headSha,
  provider,
  baseUrl,
  model,
  pingUsers,
  severityFilter,
  structuredOutputs,
}: AnalyzePRWithContextProps): Promise<AnalysisResult | null> => {
  // Filter out files without patches (binary files, etc.)
  const filesWithPatches = files.filter(
    (file: FileChange) => file.patch && file.patch.length > 0
  );

  // No text-based files to review - return null (no analysis performed)
  if (filesWithPatches.length === 0) {
    return null;
  }

  try {
    // Convert file changes to a single diff string
    // Include filename so LLM knows which file each diff belongs to
    const diff = filesWithPatches
      .map(
        (file: FileChange) =>
          `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`
      )
      .join("\n\n");

    // Call the appropriate provider
    const modelWithDefault = getModelWithDefault(provider, model);
    core.info(
      `🚀 Starting code analysis with ${provider} using model: ${modelWithDefault}`
    );
    let parsedReview;
    switch (provider) {
      case "anthropic":
        parsedReview = await callAnthropic(apiKey, modelWithDefault, diff);
        break;
      case "openai":
        parsedReview = await callOpenAI(apiKey, modelWithDefault, diff);
        break;
      case "openai-compatible":
        if (!baseUrl) {
          throw new Error(
            'base-url is required when provider is "openai-compatible"'
          );
        }
        if (!model) {
          throw new Error(
            'model is required when provider is "openai-compatible"'
          );
        }
        parsedReview = await callOpenAICompatible(
          apiKey,
          baseUrl,
          model,
          diff,
          structuredOutputs
        );
        break;
      default:
        const _exhaustiveCheck: never = provider;
        throw new Error(`Unsupported provider: ${_exhaustiveCheck}`);
    }

    // Log successful API response
    core.info(
      `✅ Successfully received response from ${provider} model: ${modelWithDefault}`
    );

    // Log AI response in nicely formatted JSON for debugging
    core.info("=== AI Response (Parsed) ===");
    core.info(JSON.stringify(parsedReview, null, 2));

    // Return null if there are no issues
    if (!parsedReview.issues || parsedReview.issues.length === 0) {
      return {
        inlineComments: [],
        aggregatedComment: null,
        allIssues: [],
      };
    }

    const filteredIssues = filterIssuesBySeverity({
      issues: parsedReview.issues,
      severityFilter,
    });
    if (filteredIssues.length === 0) {
      return {
        inlineComments: [],
        aggregatedComment: null,
        allIssues: [],
      };
    }

    // Separate issues by severity
    const { criticalHigh, mediumLowInfo } =
      separateIssuesBySeverity(filteredIssues);

    // Generate inline comments for critical/high issues
    const inlineComments = generateInlineComments({
      issues: criticalHigh,
      owner,
      repo,
      headSha,
      pingUsers,
    });

    // Generate aggregated comment for medium/low/info issues
    const aggregatedComment =
      mediumLowInfo.length > 0
        ? formatAggregatedComment({
            issues: mediumLowInfo,
            owner,
            repo,
            headSha,
            hasCriticalHighIssues: criticalHigh.length > 0,
            pingUsers,
          })
        : null;

    return {
      inlineComments,
      aggregatedComment,
      allIssues: filteredIssues,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`${provider} API error: ${errorMessage}`);

    // Re-throw the error so CI fails when there's an API error
    throw error;
  }
};
