import "server-only";

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function createAdminToken(secret: string) {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const payload = String(expires);
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifyAdminToken(token: string | undefined, secret: string | undefined) {
  if (!token || !secret) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || Number(payload) < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmac(payload, secret);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function secureEqual(first: string, second: string) {
  const digest = async (value: string) => new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
  const [left, right] = await Promise.all([digest(first), digest(second)]);
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}
