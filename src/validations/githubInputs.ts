import { z } from "zod";

const GithubInputsSchema = z
  .object({
    token: z.string().min(1, "No GitHub token provided"),
    apiKey: z.string().min(1, "No OpenAI API key provided"),
    postCommentWhenNoIssues: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || val === "" || val === "true" || val === "false",
        "post-comment-when-no-issues must be 'true' or 'false' if specified",
      )
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return val === "true";
      }),
    targetBranch: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return val.trim();
      }),
    ignorePatterns: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        // Split by newlines and filter out empty lines
        return val
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
      }),
  })
  .superRefine((data, ctx) => {
    // target-branch and post-comment-when-no-issues are mutually exclusive
    const hasTargetBranch = data.targetBranch !== undefined;
    const hasPostCommentWhenNoIssues = data.postCommentWhenNoIssues !== undefined;

    if (hasTargetBranch && hasPostCommentWhenNoIssues) {
      ctx.addIssue({
        code: "custom",
        message:
          "target-branch and post-comment-when-no-issues are mutually exclusive. Use target-branch for push events (creates issues) and post-comment-when-no-issues for PR events (creates comments).",
        path: ["targetBranch"],
      });
      ctx.addIssue({
        code: "custom",
        message:
          "target-branch and post-comment-when-no-issues are mutually exclusive. Use target-branch for push events (creates issues) and post-comment-when-no-issues for PR events (creates comments).",
        path: ["postCommentWhenNoIssues"],
      });
    }
  });

export type GithubInputs = z.infer<typeof GithubInputsSchema>;

export const validateGithubInputs = (inputs: unknown): GithubInputs => {
  return GithubInputsSchema.parse(inputs);
};
