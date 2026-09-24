import type { Db, DbStatement, ErrorLogRow } from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export function newErrorLogId(): string {
  return generateId("err");
}

export function recordErrorLogStatement(
  id: string,
  source: string,
  path: string | null,
  userId: string | null,
  message: string,
  stack: string | null,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO error_logs
       (id, user_id, source, path, message, stack, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    params: [id, userId, source, path, message, stack, now],
  };
}

/** For a pilot spot-check; not exposed over the API. Reading this table
 * is a `wrangler d1 execute` job, the same as reading analytics. */
export function listRecentErrors(db: Db, limit = 50): Promise<ErrorLogRow[]> {
  return db.all<ErrorLogRow>(
    "SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?",
    [limit],
  );
}
