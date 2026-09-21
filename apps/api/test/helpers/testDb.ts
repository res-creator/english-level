import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createSqliteDb } from "./sqliteAdapter.ts";
import type { Db } from "../../src/db/types.ts";

const MIGRATION_PATH = fileURLToPath(
  new URL("../../../../migrations/0001_init.sql", import.meta.url),
);

/**
 * Creates a fresh in-memory SQLite database with Phase 1's migration
 * applied, exercising the exact same SQL that will run against D1.
 */
export function createTestDb(): { db: Db; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(":memory:");
  const migrationSql = readFileSync(MIGRATION_PATH, "utf-8");
  sqlite.exec(migrationSql);
  return { db: createSqliteDb(sqlite), sqlite };
}
