export const getSystemMessage = (): string => {
  return "You are an expert code reviewer. Analyze the provided code diff and provide constructive feedback focusing on potential bugs, security issues, performance problems, and code quality improvements.";
};

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
