export const getSystemMessage = (): string => {
  return `You are an expert security-focused code reviewer specializing in VAPT (Vulnerability Assessment and Penetration Testing). 
Your primary responsibility is to identify security vulnerabilities using frameworks like OWASP Top 10 and CVSS scoring principles.

Prioritize security issues above all else. When analyzing code:
1. Think like an attacker - how can this be exploited?
2. Assess exploitability (how easy is it to exploit?)
3. Assess impact (what can be compromised?)
4. Classify severity based on VAPT urgency standards

All issues should be security-related: vulnerabilities (exploitable flaws), misconfigurations (security configuration issues), or best practices (security recommendations).`;
};

export const buildAnalysisPrompt = (diff: string): string => {
  return `
Please analyze this code diff with a security-first approach. Prioritize security vulnerabilities above all other issues.

Code diff:
\`\`\`
${diff}
\`\`\`

## Security Vulnerability Checks (Priority Order)

### Critical Severity:
- **Injection vulnerabilities**: SQL injection, NoSQL injection, Command injection, LDAP injection, XPath injection, Template injection
- **Remote Code Execution (RCE)**: Code execution vulnerabilities, unsafe eval(), deserialization of untrusted data
- **Authentication/Authorization Bypass**: Missing authentication, broken session management, privilege escalation, IDOR (Insecure Direct Object References)
- **Hardcoded Secrets**: API keys, passwords, tokens, private keys, credentials in code
- **XXE (XML External Entity)**: XML parsing vulnerabilities that allow file access or SSRF
- **SSRF (Server-Side Request Forgery)**: Leading to internal network access or data exfiltration
- **Insecure Deserialization**: That could lead to RCE or object injection

### High Severity:
- **XSS (Cross-Site Scripting)**: Reflected XSS, Stored XSS, DOM-based XSS in authenticated areas
- **CSRF (Cross-Site Request Forgery)**: On state-changing operations without proper tokens
- **Weak Cryptography**: Weak hashing algorithms (MD5, SHA1), weak encryption, improper key management
- **Insecure File Uploads**: Missing validation, executable file uploads, path traversal
- **Missing Rate Limiting**: On sensitive endpoints (login, API endpoints, password reset)
- **Broken Access Control**: Missing authorization checks, insecure direct object references

### Medium Severity:
- **XSS in less critical areas**: Non-authenticated areas, admin panels
- **Information Disclosure**: Stack traces in production, verbose error messages, sensitive data in logs
- **Weak Password Policies**: No complexity requirements, no account lockout
- **Missing Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Insecure Random Number Generation**: Predictable randomness for security-sensitive operations
- **Insecure Session Management**: Long session timeouts, missing secure flags

### Low Severity:
- **Missing non-critical security headers**: That don't immediately expose vulnerabilities
- **Verbose error messages**: Without sensitive data exposure
- **Code quality issues**: With minimal security impact
- **Deprecated functions**: Not immediately exploitable

### Info Severity:
- **Best practice suggestions**: Code improvements that don't represent vulnerabilities
- **Informational notes**: Security-related observations without actionable risks
- **Documentation improvements**: Security documentation or comment suggestions

## Additional Security Checks:
- **API Security**: Missing authentication, excessive data exposure, insecure CORS, missing rate limiting
- **Data Protection**: PII in logs/errors, unencrypted sensitive data, missing input validation, missing output encoding
- **Logging & Monitoring**: Insufficient security event logging, missing intrusion detection

## For Each Security Issue:
1. **Classify the security category** (injection, authentication, xss, etc.)
2. **Assess exploitability** and **impact**
3. **Determine severity** based on exploitability + impact using VAPT urgency standards

Note: Follow the JSON schema field descriptions for details on how to populate each field (description, explanation, suggestion, codeSnippet, etc.).

## Output Priority:
1. Vulnerabilities (sorted by severity: critical → high → medium → low)
2. Misconfigurations (sorted by severity)
3. Best practices (sorted by severity)

Remember: When in doubt about severity, err on the side of caution for security issues. It's better to flag a potential vulnerability as higher severity than to miss a critical security flaw.
`;
};
