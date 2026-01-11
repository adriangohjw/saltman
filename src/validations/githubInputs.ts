import * as core from "@actions/core";
import { z } from "zod";
import { SEVERITY_VALUES } from "../types";

// Allowed models for each provider
const OPENAI_MODELS = ["gpt-5.1-codex-mini", "gpt-5.1-codex-max", "gpt-5.2-codex"] as const;
const DEFAULT_OPENAI_MODEL = "gpt-5.1-codex-mini";

const ANTHROPIC_MODELS = ["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-5"] as const;
const DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-5";

const GithubInputsSchema = z
  .object({
    token: z.string().min(1, "No GitHub token provided"),
    provider: z
      .string()
      .refine((val) => val === "openai" || val === "anthropic" || val === "openai-compatible", {
        message: 'provider must be either "openai", "anthropic", or "openai-compatible"',
      })
      .transform((val) => val as "openai" | "anthropic" | "openai-compatible"),
    apiKey: z.string().min(1, "API key must be provided"),
    baseUrl: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return val.trim();
      }),
    model: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        return val.trim();
      }),
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
    structuredOutputs: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || val === "" || val === "true" || val === "false",
        "structured-outputs must be 'true' or 'false' if specified",
      )
      .transform((val) => {
        if (val === undefined || val === "") return true; // Default to true
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
    pingUsers: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;
          const items = val
            .split(/[\s\n]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
          // All items must start with "@"
          return items.every((item) => item.startsWith("@"));
        },
        {
          message:
            'ping-users: All items must start with "@" (e.g., "@user1 @team/security"). Invalid items found.',
        },
      )
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        // Split by newlines or spaces, filter out empty strings
        return val
          .split(/[\s\n]+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }),
    severityFilter: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (val === undefined || val === "") return true;
          const items = val
            .split(/[\s\n]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
          // All items must be valid severity values
          return items.every((item) =>
            SEVERITY_VALUES.includes(item as (typeof SEVERITY_VALUES)[number]),
          );
        },
        {
          message: `severity-filter: All values must be one of: ${SEVERITY_VALUES.join(", ")}. Invalid values found. Values must be newline-separated.`,
        },
      )
      .transform((val) => {
        if (val === undefined || val === "") return undefined;
        // Split by newline only, normalize to lowercase, filter out empty strings
        const items = val
          .split(/[\s\n]+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        // Return as array of valid severity values
        return items as (typeof SEVERITY_VALUES)[number][];
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

    // Validate model based on provider
    if (data.provider === "openai") {
      if (data.model && !OPENAI_MODELS.includes(data.model as (typeof OPENAI_MODELS)[number])) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid model for OpenAI provider. Allowed models: ${OPENAI_MODELS.join(", ")}. Default: ${DEFAULT_OPENAI_MODEL}`,
          path: ["model"],
        });
      }
    } else if (data.provider === "anthropic") {
      if (
        data.model &&
        !ANTHROPIC_MODELS.includes(data.model as (typeof ANTHROPIC_MODELS)[number])
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid model for Anthropic provider. Allowed models: ${ANTHROPIC_MODELS.join(", ")}. Default: ${DEFAULT_ANTHROPIC_MODEL}`,
          path: ["model"],
        });
      }
    } else if (data.provider === "openai-compatible") {
      // base-url and model are required when provider is openai-compatible
      if (!data.baseUrl) {
        ctx.addIssue({
          code: "custom",
          message: 'base-url is required when provider is "openai-compatible"',
          path: ["baseUrl"],
        });
      }
      if (!data.model) {
        ctx.addIssue({
          code: "custom",
          message: 'model is required when provider is "openai-compatible"',
          path: ["model"],
        });
      }
    }
  });

export type GithubInputs = z.infer<typeof GithubInputsSchema>;

// Helper function to get the model with default
export const getModelWithDefault = (
  provider: "openai" | "anthropic" | "openai-compatible",
  model: string | undefined,
): string => {
  if (model) {
    return model;
  }
  if (provider === "openai") {
    return DEFAULT_OPENAI_MODEL;
  }
  if (provider === "anthropic") {
    return DEFAULT_ANTHROPIC_MODEL;
  }
  // For openai-compatible, model is required (validated in schema)
  return model!;
};

export const validateGithubInputs = (inputs: unknown): GithubInputs => {
  const result = GithubInputsSchema.parse(inputs);

  // Log model selection information
  if (result.provider === "openai" || result.provider === "anthropic") {
    const modelWithDefault = getModelWithDefault(result.provider, result.model);
    if (result.model) {
      core.info(`✓ Using specified model: ${modelWithDefault} for provider: ${result.provider}`);
    } else {
      core.info(
        `✓ Using default model: ${modelWithDefault} for provider: ${result.provider} (no model specified)`,
      );
    }
  } else if (result.provider === "openai-compatible" && result.model) {
    core.info(`✓ Using model: ${result.model} for provider: ${result.provider}`);
  }

  // Encourage users to use OpenAI if they're using Anthropic
  if (result.provider === "anthropic") {
    core.warning(
      "Anthropic provider is being used. OpenAI is recommended for better performance and reliability. Consider switching to provider: 'openai'.",
    );
  }

  return result;
};
