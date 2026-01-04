import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { formatReviewResponse } from "./responses/format";
import { SALTMAN_FOOTER } from "./responses/shared";
import type { AnalyzePRProps, FileChange, ParsedReview } from "./types";
import { ReviewResponseSchema } from "./types";
import { buildAnalysisPrompt, getSystemMessage } from "./prompts";

export const analyzePR = async ({ files, apiKey }: AnalyzePRProps): Promise<string> => {
  // Filter out files without patches (binary files, etc.)
  const filesWithPatches = files.filter((file: FileChange) => file.patch && file.patch.length > 0);

  if (filesWithPatches.length === 0) {
    return `## Code Review

**Note:** No text-based file changes detected for code review.

${SALTMAN_FOOTER}`;
  }

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Convert file changes to a single diff string
    // Include filename so LLM knows which file each diff belongs to
    const diff = filesWithPatches
      .map((file: FileChange) => `--- a/${file.filename}\n+++ b/${file.filename}\n${file.patch}`)
      .join("\n\n");

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

    const parsedReview = response.output_parsed as ParsedReview;
    return formatReviewResponse({ review: parsedReview });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`OpenAI API error: ${errorMessage}`);

    // Re-throw the error so CI fails when there's an API error
    throw error;
  }
};
