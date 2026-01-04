# Example Vulnerable Code

This directory contains 2 example code files with intentional security vulnerabilities. These files are designed to test the Saltman GitHub Action's ability to detect and report security issues.

## Purpose

These files should **NEVER** be used in production code. They are for testing purposes only.

## Vulnerabilities Included

1. **SQL Injection** (`api/users.ts`)
   - Direct string concatenation in SQL queries
   - Command injection vulnerabilities

2. **Cross-Site Scripting (XSS)** (`views/search.tsx`)
   - Reflected XSS - user input rendered without sanitization
   - Using `dangerouslySetInnerHTML` with unsanitized input

## How to Test

To test the GitHub Action with these files:

1. Create a new branch in your repository
2. Copy these files into your codebase (or create a PR that adds them)
3. Open a Pull Request with these changes
4. The Saltman action should automatically detect and report the vulnerabilities

## Note

⚠️ **WARNING**: These files contain intentional security vulnerabilities. Do not:
- Use this code in production
- Commit real secrets or credentials
- Deploy these files to any environment
- Use these patterns as examples for actual development

These are **educational examples** for testing security scanning tools only.

