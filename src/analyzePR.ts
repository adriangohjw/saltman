import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import Anthropic from "@anthropic-ai/sdk";
import * as core from "@actions/core";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { separateIssuesBySeverity } from "./responses/format";
import { generateInlineComments, type InlineComment } from "./responses/inline";
import { formatAggregatedComment } from "./responses/aggregated";
import type { AnalyzePRProps, FileChange, ParsedReview } from "./types";
import { ReviewResponseSchema } from "./types";
import { buildAnalysisPrompt, getSystemMessage } from "./prompts";
import type { GithubInputs } from "./validations/githubInputs";
import { estimateMaxTokens } from "./utils/estimateMaxTokens";

interface AnalyzePRWithContextProps
  extends AnalyzePRProps, Pick<GithubInputs, "provider" | "baseUrl" | "model"> {
  owner: string;
  repo: string;
  headSha: string;
}

export interface AnalysisResult {
  inlineComments: InlineComment[];
  aggregatedComment: string | null;
  allIssues: ParsedReview["issues"];
}

const callOpenAI = async (apiKey: string, diff: string): Promise<ParsedReview> => {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const response = await openai.responses.parse({
    model: "gpt-5.1-codex-mini",
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
      "Model response could not be parsed. The model may have refused to respond or the response format was invalid.",
    );
  }

  return response.output_parsed as ParsedReview;
};

const callAnthropic = async (apiKey: string, diff: string): Promise<ParsedReview> => {
  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const response = await anthropic.beta.messages.create({
    model: "claude-opus-4-5",
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
  const responseText = response.content[0]?.type === "text" ? response.content[0].text : null;
  if (!responseText) {
    throw new Error(
      "Model response could not be parsed. The model may have refused to respond or the response format was invalid.",
    );
  }

  // Parse and validate the JSON response using the Zod schema
  const parsed = JSON.parse(responseText);
  return ReviewResponseSchema.parse(parsed);
};

const callOpenAICompatible = async (
  apiKey: string,
  baseUrl: string,
  model: string,
  diff: string,
): Promise<ParsedReview> => {
  const openaiCompatible = createOpenAICompatible({
    name: "openai-compatible",
    baseURL: baseUrl,
    apiKey: apiKey,
  });

  const { text } = await generateText({
    model: openaiCompatible.chatModel(model),
    system: getSystemMessage(),
    prompt: buildAnalysisPrompt(diff),
    experimental_output: Output.object({
      schema: ReviewResponseSchema,
    }),
  });

  if (!text) {
    throw new Error(
      "Model response could not be parsed. The model may have refused to respond or the response format was invalid.",
    );
  }

  return ReviewResponseSchema.parse(JSON.parse(text));
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
}: AnalyzePRWithContextProps): Promise<AnalysisResult | null> => {
  // Filter out files without patches (binary files, etc.)
  const filesWithPatches = files.filter((file: FileChange) => file.patch && file.patch.length > 0);

  // No text-based files to review - return null (no analysis performed)
  if (filesWithPatches.length === 0) {
    return null;
  }

  try {
    // Convert file changes to a single diff string
    // Include filename so LLM knows which file each diff belongs to
    const diff = filesWithPatches
      .map((file: FileChange) => `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`)
      .join("\n\n");

    // Call the appropriate provider
    core.info(`Using LLM provider: ${provider}`);
    let parsedReview;
    switch (provider) {
      case "anthropic":
        parsedReview = await callAnthropic(apiKey, diff);
        break;
      case "openai":
        parsedReview = await callOpenAI(apiKey, diff);
        break;
      case "openai-compatible":
        if (!baseUrl) {
          throw new Error('base-url is required when provider is "openai-compatible"');
        }
        if (!model) {
          throw new Error('model is required when provider is "openai-compatible"');
        }
        parsedReview = await callOpenAICompatible(apiKey, baseUrl, model, diff);
        break;
      default:
        const _exhaustiveCheck: never = provider;
        throw new Error(`Unsupported provider: ${_exhaustiveCheck}`);
    }

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

    // Separate issues by severity
    const { criticalHigh, mediumLowInfo } = separateIssuesBySeverity(parsedReview.issues);

    // Generate inline comments for critical/high issues
    const inlineComments = generateInlineComments({ issues: criticalHigh, owner, repo, headSha });

    // Generate aggregated comment for medium/low/info issues
    const aggregatedComment =
      mediumLowInfo.length > 0
        ? formatAggregatedComment({
            issues: mediumLowInfo,
            owner,
            repo,
            headSha,
            hasCriticalHighIssues: criticalHigh.length > 0,
          })
        : null;

    return {
      inlineComments,
      aggregatedComment,
      allIssues: parsedReview.issues,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`${provider} API error: ${errorMessage}`);

    // Re-throw the error so CI fails when there's an API error
    throw error;
  }
};
