import type { DatabaseSync } from "node:sqlite";

/**
 * A minimal stand-in for a real D1 binding, backed by the same in-memory
 * `node:sqlite` connection `createTestDb()` already sets up — just
 * shaped like `D1Database` instead of like our own `Db` interface.
 *
 * This exists for the handful of tests that need to exercise the actual
 * HTTP layer (`app.request(...)`, real Hono routing and middleware
 * composition) rather than calling a service function directly. Every
 * other test in this suite goes through `createSqliteDb` instead, which
 * is the right choice when the routing itself isn't what's under test.
 */
export function createFakeD1(sqlite: DatabaseSync): D1Database {
  function prepare(sql: string) {
    let bound: unknown[] = [];
    const statement = {
      bind(...params: unknown[]) {
        bound = params;
        return statement;
      },
      async run() {
        sqlite.prepare(sql).run(...(bound as never[]));
        return { success: true } as unknown;
      },
      async all<T>() {
        const results = sqlite.prepare(sql).all(...(bound as never[])) as T[];
        return { results, success: true } as unknown as D1Result<T>;
      },
      async first<T>() {
        const row = sqlite.prepare(sql).get(...(bound as never[]));
        return (row ?? null) as T | null;
      },
    };
    return statement as unknown as D1PreparedStatement;
  }

  return {
    prepare,
    async batch(statements: D1PreparedStatement[]) {
      sqlite.exec("BEGIN");
      try {
        for (const statement of statements) {
          await (statement as unknown as { run(): Promise<unknown> }).run();
        }
        sqlite.exec("COMMIT");
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
      return [] as unknown as D1Result[];
    },
  } as unknown as D1Database;
}
