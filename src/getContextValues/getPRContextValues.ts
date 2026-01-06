import { Context } from "@actions/github/lib/context";

export interface PRContextValues {
  prNumber: number;
  username: string;
  commitSha: string;
}

export const getPRContextValues = (context: Context): PRContextValues => {
  if (!context.payload.pull_request) {
    throw new Error("Expected pull request event but payload.pull_request is missing");
  }

  return {
    prNumber: context.payload.pull_request.number,
    username: context.payload.pull_request.user.login,
    commitSha: context.payload.pull_request.head.sha,
  };
};
