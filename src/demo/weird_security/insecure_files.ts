// src/demo/weird_security/insecure_files.ts
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// (High) Path Traversal: user input jadi bagian path tanpa sanitasi
export function readFileUnsafe(filename: string) {
  const full = path.join("/var/app/uploads", filename);
  return fs.readFileSync(full, "utf8");
}

// (Critical) Command injection: user input masuk command
export function runCommandUnsafe(arg: string) {
  exec(`cat ${arg}`, (err, stdout) => {
    if (err) console.error(err);
    console.log(stdout);
  });
}

// (Critical) eval: eksekusi code dari user
export function runEvalUnsafe(code: string) {
  // eslint-disable-next-line no-eval
  return eval(code);
}

// (High) Zip Slip pattern (pseudo): extract file entry ke disk tanpa validasi path
export function extractZipEntryUnsafe(entryName: string, content: Buffer) {
  // entryName bisa seperti ../../etc/passwd
  const outPath = path.join("/var/app/extracted", entryName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
  return outPath;
}

// (Medium/High) Log injection: tulis log mentah dari user
export function logUserInputUnsafe(input: string) {
  fs.appendFileSync("app.log", `USER=${input}\n`);
}
