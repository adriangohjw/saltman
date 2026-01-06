import { z } from "zod";

const GithubInputsSchema = z
  .object({
    token: z.string().min(1, "No GitHub token provided"),
    openaiApiKey: z
      .string()
      .optional()
      .transform((val) => (val === undefined || val === "" ? undefined : val)),
    anthropicApiKey: z
      .string()
      .optional()
      .transform((val) => (val === undefined || val === "" ? undefined : val)),
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
    // Validate that exactly one API key is provided
    const hasOpenaiKey = data.openaiApiKey !== undefined && data.openaiApiKey.length > 0;
    const hasAnthropicKey = data.anthropicApiKey !== undefined && data.anthropicApiKey.length > 0;

    if (!hasOpenaiKey && !hasAnthropicKey) {
      ctx.addIssue({
        code: "custom",
        message: "Either openai-api-key or anthropic-api-key must be provided",
        path: ["openaiApiKey"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Either openai-api-key or anthropic-api-key must be provided",
        path: ["anthropicApiKey"],
      });
    } else if (hasOpenaiKey && hasAnthropicKey) {
      ctx.addIssue({
        code: "custom",
        message:
          "Cannot provide both openai-api-key and anthropic-api-key. Please provide only one.",
        path: ["openaiApiKey"],
      });
      ctx.addIssue({
        code: "custom",
        message:
          "Cannot provide both openai-api-key and anthropic-api-key. Please provide only one.",
        path: ["anthropicApiKey"],
      });
    }
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

const GithubInputsBaseSchema = GithubInputsSchema;

export type GithubInputsBase = z.infer<typeof GithubInputsBaseSchema>;

export type GithubInputs = GithubInputsBase & {
  provider: "openai" | "claude";
  apiKey: string;
};

export const validateGithubInputs = (inputs: unknown): GithubInputs => {
  const base = GithubInputsBaseSchema.parse(inputs);

  // Infer provider from which API key is provided
  const hasOpenaiKey = base.openaiApiKey !== undefined && base.openaiApiKey.length > 0;
  const hasAnthropicKey = base.anthropicApiKey !== undefined && base.anthropicApiKey.length > 0;

  if (hasOpenaiKey) {
    return {
      ...base,
      provider: "openai",
      apiKey: base.openaiApiKey!,
    };
  } else if (hasAnthropicKey) {
    return {
      ...base,
      provider: "claude",
      apiKey: base.anthropicApiKey!,
    };
  } else {
    // This should never happen due to validation, but TypeScript needs this
    throw new Error("Either openai-api-key or anthropic-api-key must be provided");
  }
};
