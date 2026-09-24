import type { AnalyticsEventRow, Db, DbStatement } from "../db/types.ts";
import { generateId } from "../db/ids.ts";

export function newEventId(): string {
  return generateId("evt");
}

/** Builds (without executing) the insert for one event. Pure, so a
 * caller can fold it into the same `db.batch()` as the mutation the
 * event describes — a Mission pass and its `mission_passed` event either
 * both land or neither does. */
export function recordEventStatement(
  id: string,
  userId: string | null,
  anonymousId: string | null,
  eventName: string,
  propertiesJson: string,
  now: string,
): DbStatement {
  return {
    sql: `INSERT INTO analytics_events
       (id, user_id, anonymous_id, event_name, properties_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    params: [id, userId, anonymousId, eventName, propertiesJson, now],
  };
}

/** For tests and pilot spot-checks: every event of one kind, newest
 * first. Not exposed over the API — reading the funnel is a `wrangler d1
 * execute` job during the pilot, not a product feature. */
export function listEventsByName(
  db: Db,
  eventName: string,
  limit = 100,
): Promise<AnalyticsEventRow[]> {
  return db.all<AnalyticsEventRow>(
    `SELECT * FROM analytics_events
     WHERE event_name = ?
     ORDER BY created_at DESC LIMIT ?`,
    [eventName, limit],
  );
}

export function countEventsForUser(
  db: Db,
  userId: string,
  eventName: string,
): Promise<{ n: number } | null> {
  return db.first<{ n: number }>(
    "SELECT COUNT(*) n FROM analytics_events WHERE user_id = ? AND event_name = ?",
    [userId, eventName],
  );
}

export function countEventsForAnonymous(
  db: Db,
  anonymousId: string,
  eventName: string,
): Promise<{ n: number } | null> {
  return db.first<{ n: number }>(
    "SELECT COUNT(*) n FROM analytics_events WHERE anonymous_id = ? AND event_name = ?",
    [anonymousId, eventName],
  );
}
