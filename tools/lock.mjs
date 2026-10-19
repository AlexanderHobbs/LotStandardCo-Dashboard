// Encrypts the dashboard behind a password, or decrypts it back for editing.
//
//   Lock:    DASH_PASSWORD='...' node tools/lock.mjs lock dashboard.html index.html
//   Unlock:  DASH_PASSWORD='...' node tools/lock.mjs unlock index.html dashboard.html
//
// dashboard.html is the plain page. Never commit it: only the locked index.html
// belongs in the repo. Encryption: PBKDF2-SHA256 (600,000 rounds) -> AES-256-GCM.

import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const ITER = 600000;
const [mode, input, output] = process.argv.slice(2);
const password = process.env.DASH_PASSWORD;
if (!["lock", "unlock"].includes(mode) || !input || !output || !password) {
  console.error("Usage: DASH_PASSWORD='...' node tools/lock.mjs <lock|unlock> <input> <output>");
  process.exit(1);
}

const b64 = (u8) => Buffer.from(u8).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

async function key(salt) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

if (mode === "lock") {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(readFileSync(input, "utf8"));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(salt), data));
  const payload = JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) });
  const shell = readFileSync(new URL("./login-shell.html", import.meta.url), "utf8");
  writeFileSync(output, shell.replace("__PAYLOAD__", payload));
  console.log(`Locked ${input} -> ${output}`);
} else {
  const html = readFileSync(input, "utf8");
  const m = html.match(/<script id="vault" type="application\/json">(.*?)<\/script>/s);
  if (!m) { console.error("No locked content found in " + input); process.exit(1); }
  const p = JSON.parse(m[1]);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, await key(unb64(p.salt)), unb64(p.ct));
    writeFileSync(output, new TextDecoder().decode(pt));
    console.log(`Unlocked ${input} -> ${output}`);
  } catch {
    console.error("Wrong password.");
    process.exit(1);
  }
}
