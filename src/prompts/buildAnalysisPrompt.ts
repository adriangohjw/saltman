import type { FileChange } from "../types";

export const buildAnalysisPrompt = (filesWithPatches: FileChange[]): string => {
  const formattedChanges = filesWithPatches
    .map((file: FileChange) => {
      return `File: ${file.filename}
Status: ${file.status}
Additions: +${file.additions}, Deletions: -${file.deletions}

\`\`\`diff
${file.patch}
\`\`\`

---`;
    })
    .join("\n\n");

  return `You are an experienced code reviewer. Please review the following pull request changes and provide:
1. A summary of the changes
2. Potential issues or bugs
3. Code quality suggestions
4. Security concerns (if any)
5. Best practices recommendations

Keep the review constructive and actionable. Focus on the most important issues first.

${formattedChanges}`;
};
