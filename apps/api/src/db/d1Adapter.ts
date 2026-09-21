import type { Db } from "./types";

/** Wraps a real D1 binding (`env.DB`) as a {@link Db}. */
export function createD1Db(d1: D1Database): Db {
  return {
    async run(sql, params = []) {
      await d1
        .prepare(sql)
        .bind(...params)
        .run();
    },
    async all<T>(sql: string, params: unknown[] = []) {
      const { results } = await d1
        .prepare(sql)
        .bind(...params)
        .all<T>();
      return results;
    },
    async first<T>(sql: string, params: unknown[] = []) {
      const row = await d1
        .prepare(sql)
        .bind(...params)
        .first<T>();
      return row ?? null;
    },
  };
}
