import { db } from "../config/database";

// VULNERABLE: SQL Injection - user input directly concatenated into query
export async function getUserById(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return await db.query(query);
}

// VULNERABLE: SQL Injection with multiple parameters
export async function searchUsers(username: string, email: string) {
  const query = `SELECT * FROM users WHERE username = '${username}' AND email = '${email}'`;
  return await db.query(query);
}

// VULNERABLE: Command Injection
export async function deleteUserFiles(userId: string) {
  const command = `rm -rf /tmp/user_${userId}`;
  const { exec } = require("child_process");
  exec(command, (error: any, stdout: any) => {
    console.log(stdout);
  });
}
