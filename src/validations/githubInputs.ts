import { z } from "zod";

const GithubInputsSchema = z.object({
  token: z.string().min(1, "No GitHub token provided"),
  apiKey: z.string().min(1, "No OpenAI API key provided"),
  postComment: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || val === "" || val === "true" || val === "false",
      "post-comment must be 'true' or 'false' if specified",
    )
    .transform((val) => {
      if (val === undefined || val === "") return undefined;
      return val === "true";
    }),
});

export type GithubInputs = z.infer<typeof GithubInputsSchema>;

export const validateGithubInputs = (inputs: unknown): GithubInputs => {
  return GithubInputsSchema.parse(inputs);
};
