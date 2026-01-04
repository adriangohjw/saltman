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
    // Convert file changes to a single diff string
    const diff = filesWithPatches.map((file: FileChange) => file.patch).join("\n\n---\n\n");

    // Build the prompt with system and user messages
    const systemMessage =
      "You are an expert code reviewer. Analyze the provided code diff and provide constructive feedback focusing on potential bugs, security issues, performance problems, and code quality improvements.";
    const userMessage = buildAnalysisPrompt(diff);

    // Call OpenAI API using /v1/responses endpoint (required for gpt-5.1-codex-mini)
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.1-codex-mini",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "code_review_response",
            schema: getReviewSchema(),
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      content?: string;
      response?: {
        choices?: Array<{ message?: { content?: string } }>;
        content?: string;
      };
    };

    // The /v1/responses endpoint may have a different response structure
    // Try to extract content from various possible locations
    const review =
      data.choices?.[0]?.message?.content ||
      data.content ||
      data.response?.choices?.[0]?.message?.content ||
      data.response?.content;

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
