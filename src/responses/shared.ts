const SALTMAN_REPO_URL = "https://github.com/adriangohjw/saltman";
const SHORT_SHA_LENGTH = 7;

interface GetSaltmanFooterProps {
  owner: string;
  repo: string;
  commitShas?: string[];
}

export const getSaltmanFooter = ({ owner, repo, commitShas }: GetSaltmanFooterProps): string => {
  const saltmanLink = `[Saltman](${SALTMAN_REPO_URL})`;
  const footerBase = `<sub>

---

Written by ${saltmanLink}`;

  if (!commitShas || commitShas.length === 0) {
    return `${footerBase}.</sub>`;
  }

  const commitLinks = commitShas.map((sha) => {
    const shortSha = sha.substring(0, SHORT_SHA_LENGTH);
    const commitUrl = `https://github.com/${owner}/${repo}/commit/${sha}`;
    return `[${shortSha}](${commitUrl})`;
  });

  const commitsText = commitLinks.join(", ");
  const commitWord = commitShas.length === 1 ? "commit" : "commits";
  return `${footerBase} for ${commitWord} ${commitsText}.</sub>`;
};
