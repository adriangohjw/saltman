import { Request, Response } from "express";

// VULNERABLE: Weak Password Policy
// Low severity - allows weak passwords
export async function createUser(req: Request, res: Response) {
  const { username, password } = req.body;
  // No password strength requirements
  // Accepts any password length, no complexity requirements
  if (password && password.length > 0) {
    // Password accepted without validation
    return res.json({ message: "User created" });
  }
  return res.status(400).json({ error: "Password required" });
}
