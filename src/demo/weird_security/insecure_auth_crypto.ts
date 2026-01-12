// src/demo/weird_security/insecure_auth_crypto.ts
import crypto from "node:crypto";

// (Critical) Hardcoded secret
export const SECRET = "hardcoded-super-secret";

// (High) Weak hash MD5
export function md5(password: string) {
  return crypto.createHash("md5").update(password).digest("hex");
}

// (Critical) Plaintext password storage (demo)
const users: Record<string, { password: string }> = {
  admin: { password: "admin123" },
};

// (Medium/High) Timing leak: compare string biasa (bukan constant-time)
export function login(username: string, password: string) {
  const u = users[username];
  if (!u) return false;
  return u.password === password; // timing-sensitive + plaintext
}

// (Medium) Insecure random token
export function resetToken() {
  return Math.random().toString(36).slice(2);
}

// (Critical) JWT “none” algorithm acceptance (pseudo-logic)
export function verifyJwtInsecure(token: string) {
  // token format: header.payload.signature
  const [hB64, pB64] = token.split(".");
  const header = JSON.parse(Buffer.from(hB64, "base64url").toString("utf8"));

  // ⚠️ kalau alg=none, dianggap valid tanpa signature
  if (header.alg === "none") {
    const payload = JSON.parse(Buffer.from(pB64, "base64url").toString("utf8"));
    return { valid: true, payload, note: "accepted alg=none (demo)" };
  }

  // fallback: “verify” palsu
  return { valid: false, payload: null };
}

// (High) Disable TLS verification globally
export function disableTls() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
