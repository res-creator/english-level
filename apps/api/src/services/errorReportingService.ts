import type { Db } from "../db/types.ts";
import {
  newErrorLogId,
  recordErrorLogStatement,
} from "../repositories/errorLogRepository.ts";

/** Cap kept small deliberately — this is "what broke and roughly where",
 * not a full crash-reporting payload. A stack trace beyond this is
 * already enough to find the line. */
const MAX_MESSAGE_LENGTH = 2000;
const MAX_STACK_LENGTH = 4000;

/**
 * Records one unhandled failure. Never throws itself — a broken DB or a
 * malformed error object must not turn "reporting the error" into a
 * second error the caller also has to handle. Worst case, the failure is
 * still visible in the Worker's own console output (Cloudflare's
 * dashboard / `wrangler tail`), which every call here writes to as well.
 */
export async function reportError(
  db: Db,
  source: string,
  path: string | null,
  userId: string | null,
  error: unknown,
  now: string = new Date().toISOString(),
): Promise<void> {
  const message = messageOf(error).slice(0, MAX_MESSAGE_LENGTH);
  const stack = stackOf(error)?.slice(0, MAX_STACK_LENGTH) ?? null;

  console.error(`[error] ${source} ${path ?? ""} ${message}`);

  try {
    await db.batch([
      recordErrorLogStatement(
        newErrorLogId(),
        source,
        path,
        userId,
        message,
        stack,
        now,
      ),
    ]);
  } catch (loggingError) {
    // The original error already reached the console above; losing the
    // durable copy is a degraded pilot view, not a second outage.
    console.error("[error] failed to persist error_logs row", loggingError);
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function stackOf(error: unknown): string | null {
  return error instanceof Error && error.stack ? error.stack : null;
}
