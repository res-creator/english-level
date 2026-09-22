import type { Db } from "../db/types.ts";
import { loadSeedContent, type ContentBundle } from "./loadSeedContent.ts";
import { buildSeedStatements } from "./buildSeedStatements.ts";

/**
 * Applies a validated content bundle to `db` as one atomic transaction of
 * idempotent upserts (`INSERT ... ON CONFLICT DO UPDATE`) — running this
 * twice against the same database updates existing rows in place rather
 * than erroring or duplicating anything. See docs/curriculum.md.
 */
export async function seedContent(
  db: Db,
  bundle: ContentBundle = loadSeedContent(),
): Promise<void> {
  const now = new Date().toISOString();
  const statements = buildSeedStatements(bundle, now);
  await db.batch(statements);
}
