import OpenAI from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { formatErrorResponse, formatReviewResponse } from "./responses/format";
import { SALTMAN_FOOTER } from "./responses/shared";
import type { FileChange } from "./types";
import { buildAnalysisPrompt } from "./prompts/buildAnalysisPrompt";

interface AnalyzePRProps {
  files: FileChange[];
  apiKey: string;
}

const ReviewIssueSchema = z.object({
  type: z
    .enum(["bug", "security", "performance", "style", "best-practice"])
    .describe("Type of issue"),
  severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the issue"),
  message: z.string().describe("Description of the issue"),
  line: z.string().optional().describe("Line number if applicable"),
  suggestion: z.string().optional().describe("Suggested improvement"),
});

const ReviewResponseSchema = z.object({
  summary: z.string().describe("Overall assessment of the changes"),
  issues: z.array(ReviewIssueSchema).describe("List of issues found in the code"),
  positives: z.array(z.string()).describe("Things done well in this change"),
});

type ParsedReview = z.infer<typeof ReviewResponseSchema>;

const getReviewSchema = () => {
  return zodToJsonSchema(ReviewResponseSchema as any, {
    name: "code_review_response",
  }) as Record<string, unknown>;
};

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
      model: "gpt-4o-mini",
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

    // Parse the JSON response
    const parsedReview = parseResponse(review);

    return formatReviewResponse({ review: parsedReview });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`OpenAI API error: ${errorMessage}`);

    // Re-throw to allow caller to handle, but also return formatted error
    // This maintains backward compatibility
    return formatErrorResponse({ errorMessage });
  }
};
