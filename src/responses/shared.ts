interface GetSaltmanFooterProps {
  owner: string;
  repo: string;
  commitSha: string;
}

export const getSaltmanFooter = ({ owner, repo, commitSha }: GetSaltmanFooterProps): string => {
  const saltmanLink = `[Saltman](https://github.com/adriangohjw/saltman)`;
  const shortSha = commitSha.substring(0, 7);
  const commitUrl = `https://github.com/${owner}/${repo}/commit/${commitSha}`;
  const commitLink = `[${shortSha}](${commitUrl})`;
  return `<sub>

---

Written by ${saltmanLink} for commit ${commitLink}.</sub>`;
};
