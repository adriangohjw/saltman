export const getSystemMessage = (): string => {
  return "You are an expert security-focused code reviewer. Analyze the provided code diff and provide constructive feedback with a primary focus on security vulnerabilities, potential bugs, and critical issues that could impact the application's security or reliability.";
};

export const buildAnalysisPrompt = (diff: string): string => {
  return `
Please analyze this code diff and provide feedback.

Code diff:
\`\`\`
${diff}
\`\`\`

Focus on:
1. Security vulnerabilities (SQL injection, XSS, authentication/authorization flaws, insecure data handling, etc.)
2. Potential bugs or logical errors that could lead to security issues or system failures
3. Missing error handling that could expose sensitive information or cause crashes
4. Performance issues that could lead to denial of service or resource exhaustion
5. Type safety issues that could cause runtime errors or security vulnerabilities

For each issue:
- Provide a brief 2-line description (visible by default)
- Provide a more detailed but succinct explanation in the explanation field (straight-to-the-point, will be shown in a dropdown)
- Provide a helpful suggestion for fixing the issue if applicable
`;
};
