const SALTMAN_REPO_URL = "https://github.com/adriangohjw/saltman";
const SHORT_SHA_LENGTH = 7;

interface GetSaltmanFooterProps {
  owner: string;
  repo: string;
  commitSha?: string;
}

export const getSaltmanFooter = ({ owner, repo, commitSha }: GetSaltmanFooterProps): string => {
  const saltmanLink = `[Saltman](${SALTMAN_REPO_URL})`;
  const footerBase = `<sub>

---

Written by ${saltmanLink}`;

  if (commitSha) {
    const shortSha = commitSha.substring(0, SHORT_SHA_LENGTH);
    const commitUrl = `https://github.com/${owner}/${repo}/commit/${commitSha}`;
    const commitLink = `[${shortSha}](${commitUrl})`;
    return `${footerBase} for commit ${commitLink}.</sub>`;
  }

  return `${footerBase}.</sub>`;
};
