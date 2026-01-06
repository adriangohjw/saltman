/**
 * Derives the head SHA (most recent commit) from an array of commit SHAs.
 * The commits are expected to be in chronological order (oldest to newest).
 */
export const getHeadSha = (commitShas: string[]): string => {
  return commitShas[commitShas.length - 1];
};
