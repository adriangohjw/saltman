import { z } from "zod";

const GithubInputsSchema = z.object({
  token: z.string().min(1, "No GitHub token provided"),
  apiKey: z.string().min(1, "No OpenAI API key provided"),
});

export type GithubInputs = z.infer<typeof GithubInputsSchema>;

export const validateGithubInputs = (inputs: unknown): GithubInputs => {
  return GithubInputsSchema.parse(inputs);
};
