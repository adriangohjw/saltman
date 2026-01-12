// src/demo/insecure_examples.ts
import { exec } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";

/**
 * ⚠️ INTENTIONALLY INSECURE CODE (DEMO ONLY)
 * File ini sengaja dibuat lemah untuk ngetes Saltman (security analyzer).
 * JANGAN dipakai di production.
 */

// (Critical) Hardcoded secret
export const HARDCODED_JWT_SECRET = "super-secret-jwt-key-123";

// (Critical) SQL Injection pattern (string concat)
export function buildSqlQuery(userId: string) {
  return `SELECT * FROM users WHERE id = '${userId}'`;
}

// (Critical) Command Injection pattern (exec + user input)
export function runShell(userInput: string) {
  exec(`ls ${userInput}`);
}

// (High) Path Traversal pattern (file path concat)
export function readUploadedFile(filename: string) {
  return fs.readFileSync(`/var/app/uploads/${filename}`, "utf8");
}

// (High/Medium) Weak cryptography (MD5)
export function weakPasswordHash(password: string) {
  return crypto.createHash("md5").update(password).digest("hex");
}

// (Medium) Insecure randomness for token
export function insecureToken() {
  return Math.random().toString(36).slice(2);
}

// (Critical) RCE pattern (eval)
export function unsafeEval(userCode: string) {
  // eslint-disable-next-line no-eval
  return eval(userCode);
}

// (High) TLS verification disabled
export function disableTlsVerification() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
