/** Cryptographically secure, framework-agnostic token helpers (WebCrypto). */

/** A 256-bit random session token, hex-encoded. */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** SHA-256 hex digest, used to store session tokens as a hash, not plaintext. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value) as unknown as ArrayBuffer,
  );
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
