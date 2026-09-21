import type { Db, SessionRow } from "../db/types.ts";
import { generateId } from "../db/ids.ts";
import { generateSessionToken, sha256Hex } from "../auth/tokens.ts";

/**
 * Creates a new session for `userId`, valid for `ttlSeconds`. Returns the
 * raw token (only ever available here, to hand to the client) alongside
 * the stored row — the database only ever holds its hash.
 */
export async function createSession(
  db: Db,
  userId: string,
  ttlSeconds: number,
): Promise<{ session: SessionRow; token: string }> {
  const token = generateSessionToken();
  const tokenHash = await sha256Hex(token);
  const id = generateId("ses");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  await db.run(
    "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
    [id, userId, tokenHash, now.toISOString(), expiresAt.toISOString()],
  );

  const session = await db.first<SessionRow>(
    "SELECT * FROM sessions WHERE id = ?",
    [id],
  );
  if (!session) {
    throw new Error(`Failed to load session ${id} after insert`);
  }
  return { session, token };
}

/** Looks up a session by its raw token, returning null if missing or expired. */
export async function findValidSessionByToken(
  db: Db,
  token: string,
): Promise<SessionRow | null> {
  const tokenHash = await sha256Hex(token);
  const session = await db.first<SessionRow>(
    "SELECT * FROM sessions WHERE token_hash = ?",
    [tokenHash],
  );
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;
  return session;
}

export async function touchSession(db: Db, id: string): Promise<void> {
  await db.run("UPDATE sessions SET last_used_at = ? WHERE id = ?", [
    new Date().toISOString(),
    id,
  ]);
}

/** Invalidates (deletes) the session matching this raw token, if any. */
export async function deleteSessionByToken(
  db: Db,
  token: string,
): Promise<void> {
  const tokenHash = await sha256Hex(token);
  await db.run("DELETE FROM sessions WHERE token_hash = ?", [tokenHash]);
}
