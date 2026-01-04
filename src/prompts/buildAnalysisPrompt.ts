export const buildAnalysisPrompt = (diff: string): string => {
  return `
Please analyze this code diff and provide feedback.

Code diff:
\`\`\`
${diff}
\`\`\`

Focus on:
1. Potential bugs or logical errors
2. Security vulnerabilities
3. Performance issues
4. Code style and best practices
5. Missing error handling
6. Type safety issues
`;
};
