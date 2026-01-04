import OpenAI from "openai";
import { formatReviewResponse } from "./responses/format";
import { SALTMAN_FOOTER } from "./responses/shared";
import type { AnalyzePRProps, FileChange, ParsedReview } from "./types";
import { ReviewResponseSchema, getReviewSchema } from "./types";
import { buildAnalysisPrompt } from "./prompts/buildAnalysisPrompt";

const parseResponse = (content: string): ParsedReview => {
  try {
    const parsed = JSON.parse(content);
    return ReviewResponseSchema.parse(parsed);
  } catch (error) {
    console.warn("Failed to parse or validate OpenAI response", error);
    return {
      summary: content,
      issues: [],
      positives: [],
    };
  }
};

export const analyzePR = async ({ files, apiKey }: AnalyzePRProps): Promise<string> => {
  // Filter out files without patches (binary files, etc.)
  const filesWithPatches = files.filter((file: FileChange) => file.patch && file.patch.length > 0);

  if (filesWithPatches.length === 0) {
    return `## Code Review

**Note:** No text-based file changes detected for code review.

${SALTMAN_FOOTER}`;
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Convert file changes to a single diff string
    const diff = filesWithPatches.map((file: FileChange) => file.patch).join("\n\n---\n\n");

    // Call OpenAI API with JSON schema for structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1-codex-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert code reviewer. Analyze the provided code diff and provide constructive feedback focusing on potential bugs, security issues, performance problems, and code quality improvements.",
        },
        {
          role: "user",
          content: buildAnalysisPrompt(diff),
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "code_review_response",
          schema: getReviewSchema(),
          strict: true,
        },
      },
    });

    const review = completion.choices[0]?.message?.content;

    if (!review) {
      throw new Error("No review content received from OpenAI");
    }

    const parsedReview = parseResponse(review);
    return formatReviewResponse({ review: parsedReview });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`OpenAI API error: ${errorMessage}`);

    // Re-throw the error so CI fails when there's an API error
    throw error;
  }
};
