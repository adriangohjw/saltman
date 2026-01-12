// src/demo/weird_security/insecure_web.ts

/**
 * ⚠️ INTENTIONALLY INSECURE CODE (DEMO ONLY)
 * File ini sengaja dibuat lemah untuk ngetes Saltman (security analyzer).
 * JANGAN dipakai di production.
 */

// (High) CORS terlalu bebas: origin mentah dibalikin + allow credentials
export function insecureCorsHeaders(origin: string | undefined): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
}

// (Critical) Reflected XSS: input user dimasukin ke HTML tanpa escape
export function reflectedXssHtml(name: string): string {
  return `<html><body><h1>Hello ${name}</h1></body></html>`;
}

// (High) Open Redirect: url tujuan dari user tanpa validasi domain
export function openRedirect(nextUrl: string): string {
  return nextUrl;
}

// (High) Cookie insecure: tidak httpOnly/secure
export function insecureSetCookie(username: string): string {
  // contoh header Set-Cookie yang buruk
  return `session=user=${username}; Path=/; SameSite=None`; // no HttpOnly, no Secure
}

// (High) CSRF lemah: aksi sensitif tanpa token/verify
export function transferWithoutCsrf(to: string, amount: number): { ok: true; to: string; amount: number } {
  return { ok: true, to, amount };
}

// (High) IDOR: akses data user lain hanya dari id (tanpa cek ownership)
export function getUserProfileIdor(id: string): { id: string; secretProfile: string } {
  return { id, secretProfile: `Sensitive data of user ${id}` };
}

// (Critical) SSRF: server fetch URL dari user (bisa ke internal)
export async function ssrfFetch(url: string): Promise<string> {
  const r = await fetch(url);
  return await r.text();
}

// (High) NoSQL injection pattern: filter object dari user dipakai mentah
export function nosqlFilterUsedDirectly(filter: unknown): { ok: true; usedFilterDirectly: unknown } {
  return { ok: true, usedFilterDirectly: filter };
}

// (High) Prototype pollution pattern: merge object user tanpa sanitasi key __proto__/constructor
export function prototypePollutionMerge(target: Record<string, unknown>, userObj: Record<string, unknown>): Record<string, unknown> {
  // sengaja buruk: Object.assign langsung
  return Object.assign(target, userObj);
}

// (Medium/High) Regex DoS pattern: regex dari user (catastrophic backtracking)
export function regexDos(userRegex: string, input: string): boolean {
  const re = new RegExp(userRegex); // contoh buruk
  return re.test(input);
}

// (Critical) Code injection: Function constructor dari input user
export function functionConstructorInjection(userCode: string): unknown {
  // eslint/linters may warn; ini memang sengaja buruk untuk demo
  // @ts-ignore
  return new Function(`return (${userCode});`)();
}
