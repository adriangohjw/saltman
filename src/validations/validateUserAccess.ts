import { getOctokit } from "@actions/github";

interface ValidateUserAccessProps {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  username: string;
}

export const validateUserAccess = async ({
  octokit,
  owner,
  repo,
  username,
}: ValidateUserAccessProps): Promise<void> => {
  const { data: permission } = await octokit.rest.repos.getCollaboratorPermissionLevel({
    owner,
    repo,
    username,
  });

  const hasWriteAccess = ["write", "maintain", "admin"].includes(permission.permission);

  if (!hasWriteAccess) {
    throw new Error("User does not have collaborator access to the repository");
  }
};
