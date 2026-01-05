import { db } from "../config/database";
import { Request, Response } from "express";

// VULNERABLE: Insecure Direct Object Reference (IDOR)
// Medium severity - allows unauthorized access to resources
export async function getUserProfile(req: Request, res: Response) {
  const userId = req.params.userId;
  // Missing authorization check - any user can access any profile
  const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
  return res.json(user);
}

// VULNERABLE: Missing Rate Limiting
// Medium severity - allows brute force attacks
export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  // No rate limiting - attacker can try unlimited login attempts
  const user = await db.query(
    `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`,
  );
  if (user) {
    return res.json({ token: "session_token_here" });
  }
  return res.status(401).json({ error: "Invalid credentials" });
}
