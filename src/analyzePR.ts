import OpenAI from "openai";
import { formatErrorResponse, formatReviewResponse } from "./responses/format";
import { SALTMAN_FOOTER } from "./responses/shared";
import { MOCK_REPONSE } from "./responses/mockResponse";
import type { FileChange } from "./types";
import { buildAnalysisPrompt } from "./prompts/buildAnalysisPrompt";

interface AnalyzePRProps {
  files: FileChange[];
  apiKey: string;
}

const validateApiKey = (apiKey: AnalyzePRProps["apiKey"]): void => {
  if (!apiKey || apiKey.trim() === "") {
    console.warn("⚠️  No valid OpenAI API key provided or using test key. Using mock responses.");
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

  // Validate API key and return mock response if not provided or invalid
  if (!apiKey) {
    validateApiKey(apiKey);
    return MOCK_REPONSE;
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert code reviewer. Analyze the provided code diff and provide constructive feedback focusing on potential bugs, security issues, performance problems, and code quality improvements.",
        },
        {
          role: "user",
          content: buildAnalysisPrompt(filesWithPatches),
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const review = completion.choices[0]?.message?.content;

    if (!review) {
      throw new Error("No review content received from OpenAI");
    }

    return formatReviewResponse({ review });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`OpenAI API error: ${errorMessage}`);

    // Re-throw to allow caller to handle, but also return formatted error
    // This maintains backward compatibility
    return formatErrorResponse({ errorMessage });
  }
};
