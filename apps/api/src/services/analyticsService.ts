import type { EventName, EventProperties } from "@english-level/contracts";
import type { Db, DbStatement } from "../db/types.ts";
import {
  newEventId,
  recordEventStatement,
} from "../repositories/analyticsRepository.ts";

/**
 * Two ways an event gets recorded, both writing the same row:
 *
 * - `eventStatement` is a pure builder. Other services fold its result
 *   into their own `db.batch()`, so e.g. a Mission pass and its
 *   `mission_passed` event either both land or neither does — the log
 *   can never show a funnel step that didn't actually happen, or miss
 *   one that did because the process died a moment later.
 * - `trackClientEvent` executes on its own. It's for the small set of
 *   events only the client can see at all (a screen was opened, a demo
 *   was skipped) — there is no mutation to piggyback on.
 */
export function eventStatement(
  eventName: EventName,
  options: {
    userId?: string | null;
    anonymousId?: string | null;
    properties?: EventProperties;
  },
  now: string,
): DbStatement {
  return recordEventStatement(
    newEventId(),
    options.userId ?? null,
    options.anonymousId ?? null,
    eventName,
    JSON.stringify(options.properties ?? {}),
    now,
  );
}

export async function trackClientEvent(
  db: Db,
  eventName: EventName,
  options: {
    userId?: string | null;
    anonymousId?: string | null;
    properties?: EventProperties;
  },
  now: string = new Date().toISOString(),
): Promise<void> {
  await db.batch([eventStatement(eventName, options, now)]);
}
