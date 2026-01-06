import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import * as core from "@actions/core";
import { separateIssuesBySeverity } from "./responses/format";
import { generateInlineComments, type InlineComment } from "./responses/inline";
import { formatAggregatedComment } from "./responses/aggregated";
import type { AnalyzePRProps, FileChange, ParsedReview } from "./types";
import { ReviewResponseSchema } from "./types";
import { buildAnalysisPrompt, getSystemMessage } from "./prompts";

interface AnalyzePRWithContextProps extends AnalyzePRProps {
  owner: string;
  repo: string;
  commitShas: string[];
}

export interface AnalysisResult {
  inlineComments: InlineComment[];
  aggregatedComment: string | null;
  allIssues: ParsedReview["issues"];
}

export const analyzePR = async ({
  files,
  apiKey,
  owner,
  repo,
  commitShas,
}: AnalyzePRWithContextProps): Promise<AnalysisResult | null> => {
  // Filter out files without patches (binary files, etc.)
  const filesWithPatches = files.filter((file: FileChange) => file.patch && file.patch.length > 0);

  // No text-based files to review - return null (no analysis performed)
  if (filesWithPatches.length === 0) {
    return null;
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

    // Check if output_parsed is null (can happen when model refuses or parsing fails)
    if (response.output_parsed === null) {
      throw new Error(
        "Model response could not be parsed. The model may have refused to respond or the response format was invalid.",
      );
    }

    const parsedReview = response.output_parsed as ParsedReview;

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
    const inlineComments = generateInlineComments({
      issues: criticalHigh,
      owner,
      repo,
      commitShas,
    });

    // Generate aggregated comment for medium/low/info issues
    const aggregatedComment =
      mediumLowInfo.length > 0
        ? formatAggregatedComment({
            issues: mediumLowInfo,
            owner,
            repo,
            commitShas,
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
    console.error(`OpenAI API error: ${errorMessage}`);

    // Re-throw the error so CI fails when there's an API error
    throw error;
  }
};
