// This file contains obvious security vulnerabilities for testing ignore patterns
// DO NOT USE IN PRODUCTION

import { exec } from "child_process";

// VULNERABILITY 1: Command Injection
export function executeCommand(userInput: string) {
  // This is vulnerable to command injection
  exec(`ls -la ${userInput}`, (error, stdout) => {
    console.log(stdout);
  });
}

// VULNERABILITY 2: XSS (Cross-Site Scripting)
export function renderUserContent(userContent: string) {
  // This is vulnerable to XSS - user content is directly inserted into HTML
  return `<div>${userContent}</div>`;
}

// VULNERABILITY 3: Insecure Random Number Generation
export function generateSessionToken() {
  // Using Math.random() for security-sensitive operations is insecure
  return Math.random().toString(36).substring(2, 15);
}

// VULNERABILITY 4: Weak Cryptography
export function hashPassword(password: string) {
  // MD5 is cryptographically broken and should not be used
  const crypto = require("crypto");
  return crypto.createHash("md5").update(password).digest("hex");
}

// VULNERABILITY 5: Path Traversal
export function readFile(filename: string) {
  const fs = require("fs");
  // This is vulnerable to path traversal attacks
  return fs.readFileSync(`/data/${filename}`, "utf8");
}

// VULNERABILITY 6: Insecure Deserialization
export function deserializeData(data: string) {
  // Using eval() for deserialization is extremely dangerous
  return eval(`(${data})`);
}
