import type { ParsedReview } from "./types";
import { formatReviewResponse } from "./responses/format";

/**
 * Example vulnerabilities for testing the output formatting
 */
export const getExampleVulnerabilities = (): ParsedReview => {
  return {
    issues: [
      {
        title: "SQL Injection in User Query",
        type: "vulnerability",
        severity: "critical",
        description: "User input is directly concatenated into SQL query without sanitization, allowing SQL injection attacks.",
        explanation:
          "The code constructs SQL queries by directly concatenating user input, which allows attackers to inject malicious SQL code. This can lead to unauthorized database access, data exfiltration, or complete database compromise. Attackers can execute arbitrary SQL commands, potentially accessing sensitive user data, modifying records, or even dropping tables.",
        location: {
          file: "src/api/users.ts",
          startLine: 42,
          endLine: 45,
        },
        suggestion:
          "Use parameterized queries or prepared statements instead of string concatenation. For example, use an ORM like Prisma or TypeORM, or use parameterized queries with your database driver. Never trust user input and always validate and sanitize data before using it in database queries.",
        codeSnippet: `// Vulnerable code:
const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;

// Fixed code:
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);`,
        securityCategory: "injection",
        exploitability: "easy",
        impact: "data_breach",
      },
      {
        title: "Hardcoded API Key in Source Code",
        type: "vulnerability",
        severity: "critical",
        description: "API key is hardcoded directly in the source code, exposing credentials in version control.",
        explanation:
          "Hardcoded credentials in source code are a critical security risk. If the code is committed to version control, the credentials become permanently exposed. Even if removed later, they remain in git history. Attackers can use these credentials to gain unauthorized access to external services, potentially leading to data breaches or service abuse.",
        location: {
          file: "src/config/api.ts",
          startLine: 15,
        },
        suggestion:
          "Move all secrets to environment variables or a secure secrets management system (e.g., AWS Secrets Manager, HashiCorp Vault, or GitHub Secrets). Never commit secrets to version control. Use a .env file for local development (and ensure it's in .gitignore) and environment variables in production.",
        securityCategory: "secrets",
        exploitability: "easy",
        impact: "system_compromise",
      },
      {
        title: "Missing Authentication on Admin Endpoint",
        type: "vulnerability",
        severity: "high",
        description: "Admin endpoint lacks authentication checks, allowing unauthorized access to sensitive operations.",
        explanation:
          "The admin endpoint does not verify user authentication before processing requests. This allows any unauthenticated user to access administrative functions, potentially leading to privilege escalation, unauthorized data access, or system configuration changes. Attackers can exploit this to gain administrative privileges or perform destructive operations.",
        location: {
          file: "src/routes/admin.ts",
          startLine: 28,
          endLine: 35,
        },
        suggestion:
          "Add authentication middleware to verify the user is authenticated before processing admin requests. Additionally, implement authorization checks to ensure only users with admin roles can access these endpoints. Use role-based access control (RBAC) to manage permissions.",
        securityCategory: "authorization",
        exploitability: "easy",
        impact: "privilege_escalation",
      },
      {
        title: "Reflected XSS in Search Parameter",
        type: "vulnerability",
        severity: "high",
        description: "User input from search query is rendered without sanitization, enabling cross-site scripting attacks.",
        explanation:
          "The search parameter is directly rendered in the HTML response without proper encoding or sanitization. Attackers can craft malicious URLs containing JavaScript code that will execute in the victim's browser when they visit the link. This can lead to session hijacking, credential theft, or unauthorized actions performed on behalf of the user.",
        location: {
          file: "src/views/search.html",
          startLine: 23,
        },
        suggestion:
          "Always encode user input when rendering it in HTML. Use context-appropriate encoding (HTML entity encoding for HTML context, JavaScript encoding for JavaScript context, etc.). Consider using a templating library that automatically escapes output, or use a library like DOMPurify for sanitization.",
        codeSnippet: `// Vulnerable code:
<div>Search results for: <%= searchQuery %></div>

// Fixed code:
<div>Search results for: <%= escapeHtml(searchQuery) %></div>`,
        securityCategory: "xss",
        exploitability: "medium",
        impact: "information_disclosure",
      },
      {
        title: "Weak Password Hashing Algorithm",
        type: "vulnerability",
        severity: "high",
        description: "Passwords are hashed using MD5, which is cryptographically broken and vulnerable to rainbow table attacks.",
        explanation:
          "MD5 is a weak hashing algorithm that is no longer considered secure. It is vulnerable to collision attacks and rainbow table lookups. Attackers can easily crack MD5 hashed passwords using precomputed hash tables or brute force attacks. If the database is compromised, passwords can be quickly recovered.",
        location: {
          file: "src/auth/password.ts",
          startLine: 12,
        },
        suggestion:
          "Use a modern, secure password hashing algorithm like bcrypt, Argon2, or scrypt. These algorithms are specifically designed for password hashing and include features like salting and cost factors that make brute force attacks computationally expensive. Never use MD5, SHA1, or other general-purpose hash functions for passwords.",
        codeSnippet: `// Vulnerable code:
const hash = crypto.createHash('md5').update(password).digest('hex');

// Fixed code:
const hash = await bcrypt.hash(password, 10);`,
        securityCategory: "cryptography",
        exploitability: "medium",
        impact: "data_breach",
      },
      {
        title: "Missing CSRF Protection on State-Changing Operations",
        type: "vulnerability",
        severity: "medium",
        description: "POST endpoints lack CSRF token validation, allowing cross-site request forgery attacks.",
        explanation:
          "Without CSRF protection, attackers can trick authenticated users into performing unintended actions by crafting malicious requests from other websites. When a user visits an attacker's site while logged into your application, the attacker can make requests on their behalf, potentially modifying data or performing unauthorized actions.",
        location: {
          file: "src/routes/users.ts",
          startLine: 45,
          endLine: 52,
        },
        suggestion:
          "Implement CSRF token validation for all state-changing operations (POST, PUT, DELETE, PATCH). Generate a unique CSRF token for each session and require it to be included in requests. Use frameworks that provide built-in CSRF protection, or implement token validation middleware.",
        securityCategory: "csrf",
        exploitability: "medium",
        impact: "data_modification",
      },
      {
        title: "Insufficient Rate Limiting on Login Endpoint",
        type: "misconfiguration",
        severity: "medium",
        description: "Login endpoint lacks rate limiting, enabling brute force password attacks.",
        explanation:
          "Without rate limiting, attackers can make unlimited login attempts, making brute force attacks feasible. They can systematically try common passwords or use password lists to guess user credentials. This significantly increases the risk of account compromise, especially for users with weak passwords.",
        location: {
          file: "src/routes/auth.ts",
          startLine: 18,
        },
        suggestion:
          "Implement rate limiting on authentication endpoints. Limit the number of login attempts per IP address or username within a time window (e.g., 5 attempts per 15 minutes). Consider implementing account lockout after multiple failed attempts. Use middleware like express-rate-limit or similar for your framework.",
        securityCategory: "authentication",
        exploitability: "easy",
        impact: "privilege_escalation",
      },
      {
        title: "Missing Security Headers",
        type: "best_practice",
        severity: "low",
        description: "Application lacks important security headers like CSP, HSTS, and X-Frame-Options.",
        explanation:
          "Security headers provide additional layers of protection against various attacks. Missing headers like Content-Security-Policy (CSP) can leave the application vulnerable to XSS attacks, while missing HSTS can expose users to man-in-the-middle attacks. X-Frame-Options prevents clickjacking attacks.",
        location: {
          file: "src/middleware/security.ts",
          startLine: 1,
          endLine: 10,
        },
        suggestion:
          "Add security headers to all HTTP responses. Include headers like Content-Security-Policy, Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. Use middleware like helmet.js for Express applications or configure headers in your web server.",
        securityCategory: "config",
      },
      {
        title: "Sensitive Data in Error Messages",
        type: "vulnerability",
        severity: "low",
        description: "Error messages expose internal system details that could aid attackers.",
        explanation:
          "Verbose error messages that include stack traces, file paths, or database query details can provide valuable information to attackers. This information disclosure can help attackers understand the application structure, identify potential vulnerabilities, or craft more targeted attacks.",
        location: {
          file: "src/middleware/errorHandler.ts",
          startLine: 25,
        },
        suggestion:
          "Implement different error handling for development and production environments. In production, return generic error messages to users while logging detailed errors server-side. Never expose stack traces, file paths, or internal system details in production error responses.",
        securityCategory: "logging",
        exploitability: "easy",
        impact: "information_disclosure",
      },
    ],
  };
};

/**
 * Test function to display formatted example vulnerabilities
 */
export const testExampleOutput = (owner: string = "example", repo: string = "repo", headSha: string = "abc123"): string => {
  const exampleReview = getExampleVulnerabilities();
  return formatReviewResponse({ review: exampleReview, owner, repo, headSha });
};

