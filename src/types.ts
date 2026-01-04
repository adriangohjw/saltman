import { z } from "zod";

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface AnalyzePRProps {
  files: FileChange[];
  apiKey: string;
}

const LocationSchema = z
  .object({
    file: z
      .string()
      .describe("File path where the issue is located (from the diff, e.g., 'src/file.ts')"),
    startLine: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe("Starting line number (1-indexed)"),
    endLine: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe("Ending line number (1-indexed, only if issue spans multiple lines)"),
  })
  .nullable()
  .optional()
  .describe("Location of the issue in the codebase");

export const ReviewIssueSchema = z.object({
  title: z.string().describe("Concise title for the issue (3-8 words)"),
  type: z.enum(["bug", "security", "performance"]).describe("Type of issue"),
  severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the issue"),
  description: z
    .string()
    .describe(
      "Brief 2-line summary of the issue (visible by default, keep it concise and to the point)",
    ),
  explanation: z
    .string()
    .describe(
      "More detailed but succinct explanation of the issue, why it matters, and its impact (straight-to-the-point, will be shown in a dropdown)",
    ),
  location: LocationSchema,
  suggestion: z.string().nullable().optional().describe("Helpful suggestion for fixing the issue"),
  codeSnippet: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Optional code snippet showing the proposed solution. Only include this when a code example would genuinely help the engineer understand the fix better. Most issues should NOT include this field. Only include when the solution is complex or when seeing actual code would significantly clarify the approach.",
    ),
});

export const ReviewResponseSchema = z.object({
  issues: z.array(ReviewIssueSchema).describe("List of issues found in the code"),
});

export type ParsedReview = z.infer<typeof ReviewResponseSchema>;

export const getReviewSchema = () => {
  return z.toJSONSchema(ReviewResponseSchema) as Record<string, unknown>;
};
