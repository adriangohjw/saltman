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

export const ReviewIssueSchema = z.object({
  type: z.enum(["bug", "security", "performance", "best-practice"]).describe("Type of issue"),
  severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the issue"),
  message: z.string().describe("Description of the issue"),
  line: z.string().nullable().optional().describe("Line number if applicable"),
  suggestion: z.string().nullable().optional().describe("Suggested improvement"),
});

export const ReviewResponseSchema = z.object({
  summary: z.string().describe("Overall assessment of the changes"),
  issues: z.array(ReviewIssueSchema).describe("List of issues found in the code"),
  positives: z.array(z.string()).describe("Things done well in this change"),
});

export type ParsedReview = z.infer<typeof ReviewResponseSchema>;

export const getReviewSchema = () => {
  return z.toJSONSchema(ReviewResponseSchema) as Record<string, unknown>;
};
