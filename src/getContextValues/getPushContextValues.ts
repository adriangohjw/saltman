import { Context } from "@actions/github/lib/context";

export interface PushContextValues {
  username: string;
  commitSha: string;
}

export const getPushContextValues = (context: Context): PushContextValues => {
  if (context.eventName !== "push" || !context.payload.head_commit) {
    throw new Error("Expected push event but payload.head_commit is missing");
  }

  return {
    username: context.payload.head_commit.author.username || context.actor,
    commitSha: context.sha,
  };
};
