import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createSqliteDb } from "./sqliteAdapter.ts";
import type { Db } from "../../src/db/types.ts";

const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../../../migrations/", import.meta.url),
);

/**
 * Creates a fresh in-memory SQLite database with every migration applied,
 * in order, exercising the exact same SQL that will run against D1.
 */
export function createTestDb(): { db: Db; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(":memory:");
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    sqlite.exec(readFileSync(`${MIGRATIONS_DIR}${file}`, "utf-8"));
  }
  return { db: createSqliteDb(sqlite), sqlite };
}
