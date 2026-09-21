import type { DatabaseSync } from "node:sqlite";
import type { Db } from "../../src/db/types.ts";

/** Wraps an in-memory `node:sqlite` connection as a {@link Db} for tests. */
export function createSqliteDb(sqlite: DatabaseSync): Db {
  return {
    async run(sql, params = []) {
      sqlite.prepare(sql).run(...(params as never[]));
    },
    async all<T>(sql: string, params: unknown[] = []) {
      return sqlite.prepare(sql).all(...(params as never[])) as T[];
    },
    async first<T>(sql: string, params: unknown[] = []) {
      const row = sqlite.prepare(sql).get(...(params as never[]));
      return (row ?? null) as T | null;
    },
  };
}
