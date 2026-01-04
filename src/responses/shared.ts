export const getSaltmanFooter = (owner: string, repo: string, commitSha: string): string => {
  const saltmanLink = `[Saltman](https://github.com/adriangohjw/saltman)`;
  const commitUrl = `https://github.com/${owner}/${repo}/commit/${commitSha}`;
  const commitLink = `[${commitSha}](${commitUrl})`;
  return `---

Written by ${saltmanLink} for commit ${commitLink}.`;
};
