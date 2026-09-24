import test from "node:test";
import assert from "node:assert/strict";
import type { DatabaseSync } from "node:sqlite";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import {
  eventStatement,
  trackClientEvent,
} from "../src/services/analyticsService.ts";
import {
  countEventsForAnonymous,
  countEventsForUser,
} from "../src/repositories/analyticsRepository.ts";
import { onlyLevel, runFixtureAttempt } from "./helpers/placementFixtures.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";
import { startLessonSession } from "../src/services/lessonSessionService.ts";
import {
  answerReviewActivity,
  startReviewSession,
} from "../src/services/reviewService.ts";
import {
  acceptInvite,
  createInvite,
  getFriendState,
  WEEKLY_GOAL_TARGET,
  weekStart,
} from "../src/services/friendService.ts";
import { resetPreviewAccount } from "../src/services/previewResetService.ts";
import {
  createUser,
  setOnboardingStage,
} from "../src/repositories/usersRepository.ts";
import { createDefaultUserSettings } from "../src/repositories/userSettingsRepository.ts";

const EPISODE_1 = "les_sie_a1_e1";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

function rowsFor(
  sqlite: DatabaseSync,
  eventName: string,
): {
  user_id: string | null;
  anonymous_id: string | null;
  properties_json: string;
}[] {
  return sqlite
    .prepare(
      "SELECT user_id, anonymous_id, properties_json FROM analytics_events WHERE event_name = ? ORDER BY created_at ASC",
    )
    .all(eventName) as never;
}

// --- the primitive ----------------------------------------------------------

test("trackClientEvent records a row with the event's own properties", async () => {
  const { db, sqlite } = await seeded();
  await trackClientEvent(db, "welcome_viewed", {
    anonymousId: "anon-1",
    properties: { source: "telegram" },
  });

  const rows = rowsFor(sqlite, "welcome_viewed");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.user_id, null);
  assert.equal(rows[0]?.anonymous_id, "anon-1");
  assert.deepEqual(JSON.parse(rows[0]!.properties_json), {
    source: "telegram",
  });
});

test("an event with no properties still records — properties default to {}", async () => {
  const { db, sqlite } = await seeded();
  await trackClientEvent(db, "demo_skipped", { anonymousId: "anon-2" });

  const rows = rowsFor(sqlite, "demo_skipped");
  assert.equal(rows.length, 1);
  assert.deepEqual(JSON.parse(rows[0]!.properties_json), {});
});

test("eventStatement folds into a caller's own transaction", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 9000, "A1");
  const now = new Date().toISOString();
  await db.batch([
    eventStatement(
      "companion_chosen",
      { userId: user.id, properties: { companionId: "cmp_fox" } },
      now,
    ),
  ]);

  const rows = rowsFor(sqlite, "companion_chosen");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.user_id, user.id);
});

// --- server-emitted events, one per real product moment --------------------

test("finishing the placement test logs placement_completed with the result level", async () => {
  const { db, sqlite } = await seeded();
  const user = await createUser(db, {
    telegramUserId: 9001,
    firstName: "Test",
  });
  await createDefaultUserSettings(db, user.id);
  await setOnboardingStage(db, user.id, "placement_required");

  await runFixtureAttempt(db, user.id, onlyLevel("A1"));

  const rows = rowsFor(sqlite, "placement_completed");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.user_id, user.id);
  const props = JSON.parse(rows[0]!.properties_json) as { level: string };
  assert.equal(props.level, "A1");
});

test("finishing one daily session logs session_completed, not a mission event", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 9002, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);

  assert.equal(rowsFor(sqlite, "session_completed").length, 1);
  assert.equal(rowsFor(sqlite, "mission_passed").length, 0);
  assert.equal(rowsFor(sqlite, "mission_failed").length, 0);
});

test("a passed Mission logs mission_passed with the accuracy that earned it", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 9003, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);

  const rows = rowsFor(sqlite, "mission_passed");
  assert.equal(rows.length, 1);
  const props = JSON.parse(rows[0]!.properties_json) as {
    episodeId: string;
    accuracy: number;
  };
  assert.equal(props.episodeId, EPISODE_1);
  assert.ok(props.accuracy >= 80);
  assert.equal(rowsFor(sqlite, "mission_failed").length, 0);
});

test("a failed Mission logs mission_failed, and only that — never a pass", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 9004, "A1");

  for (let guard = 0; guard < 12; guard++) {
    const started = await startLessonSession(db, user.id, EPISODE_1);
    if (!started.ok) throw new Error("start failed");
    const isMission = started.session.kind === "mission";
    await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1, {
      correct: !isMission,
    });
    if (isMission) break;
  }

  assert.equal(rowsFor(sqlite, "mission_failed").length, 1);
  assert.equal(rowsFor(sqlite, "mission_passed").length, 0);
});

test("finishing a review session logs review_completed with an honest count and accuracy", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 9005, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  sqlite
    .prepare("UPDATE user_item_memory SET due_at = ?")
    .run(new Date(Date.now() - 86_400_000).toISOString());

  const started = await startReviewSession(db, user.id);
  if (!started.ok) throw new Error("review start failed");
  let current = started.session.currentActivity;
  const sessionId = started.session.sessionId;
  let i = 0;
  while (current) {
    const stored = JSON.parse(
      (
        sqlite
          .prepare("SELECT activities_json FROM review_sessions WHERE id = ?")
          .get(sessionId) as { activities_json: string }
      ).activities_json,
    ) as {
      id: string;
      correctOptionId?: string;
      acceptedAnswers?: string[];
      correctAnswer?: string;
    }[];
    const activity = stored.find((a) => a.id === current!.id)!;
    const answer =
      activity.correctOptionId ??
      activity.acceptedAnswers?.[0] ??
      activity.correctAnswer ??
      "ack";
    const res = await answerReviewActivity(db, user.id, sessionId, {
      activityId: current.id,
      answer,
      attemptId: `rev-${i++}`,
    });
    if (!res.ok) throw new Error("review answer failed");
    if (res.session.status === "completed") break;
    current = res.session.nextActivity;
  }

  const rows = rowsFor(sqlite, "review_completed");
  assert.equal(rows.length, 1);
  const props = JSON.parse(rows[0]!.properties_json) as {
    reviewed: number;
    accuracy: number;
  };
  assert.ok(props.reviewed > 0);
  assert.equal(props.accuracy, 100);
});

test("inviting and accepting a friend each log their own event, once", async () => {
  const { db, sqlite } = await seeded();
  const a = await makeVerifiedUser(db, 9006, "A1");
  const b = await makeVerifiedUser(db, 9007, "A1");

  const invite = await createInvite(db, a.id);
  assert.equal(invite.ok, true);
  if (!invite.ok) return;
  // A re-tapped invite returns the same code without minting a new one —
  // it must not log a second friend_invited.
  await createInvite(db, a.id);
  assert.equal(rowsFor(sqlite, "friend_invited").length, 1);

  await acceptInvite(db, b.id, invite.code);
  assert.equal(rowsFor(sqlite, "friend_accepted").length, 1);
  assert.equal(rowsFor(sqlite, "friend_accepted")[0]?.user_id, b.id);
});

test("the shared goal logs once, on the call that actually unlocked it — not on every later poll", async () => {
  const { db, sqlite } = await seeded();
  const a = await makeVerifiedUser(db, 9008, "A1");
  const b = await makeVerifiedUser(db, 9009, "A1");
  const invite = await createInvite(db, a.id);
  if (!invite.ok) return;
  await acceptInvite(db, b.id, invite.code);

  const thisWeek = new Date(weekStart().getTime() + 3600_000).toISOString();
  for (let i = 0; i < WEEKLY_GOAL_TARGET; i++) {
    sqlite
      .prepare(
        `INSERT INTO learning_sessions
           (id, user_id, lesson_id, session_type, session_kind, session_index,
            status, started_at, completed_at, current_position, correct_count,
            wrong_count, activities_json, created_at, updated_at)
         VALUES (?, ?, ?, 'lesson', 'lesson', 1, 'completed', ?, ?, 0, 0, 0, '[]', ?, ?)`,
      )
      .run(
        `lsn_fake_${i}`,
        i % 2 === 0 ? a.id : b.id,
        EPISODE_1,
        thisWeek,
        thisWeek,
        thisWeek,
        thisWeek,
      );
  }

  await getFriendState(db, a.id);
  await getFriendState(db, a.id);
  await getFriendState(db, a.id);

  assert.equal(rowsFor(sqlite, "shared_goal_completed").length, 1);
});

test("resetting a preview account logs preview_account_reset, and analytics survives the reset itself", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 9010, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  const before = rowsFor(sqlite, "session_completed").length;
  assert.ok(before > 0);

  await resetPreviewAccount(db, user.id);

  assert.equal(rowsFor(sqlite, "preview_account_reset").length, 1);
  // The reset clears what the account knows, not the record of what it
  // did — session_completed rows from before the reset must remain.
  assert.equal(rowsFor(sqlite, "session_completed").length, before);
});

// --- scope and honesty -------------------------------------------------------

test("an event never claims a user_id it wasn't given", async () => {
  const { db, sqlite } = await seeded();
  await trackClientEvent(db, "demo_started", { anonymousId: "anon-only" });
  const row = sqlite
    .prepare(
      "SELECT user_id FROM analytics_events WHERE event_name = 'demo_started'",
    )
    .get() as { user_id: string | null };
  assert.equal(row.user_id, null);
});

test("countEventsForUser and countEventsForAnonymous read back what was written", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 9011, "A1");
  await trackClientEvent(db, "welcome_viewed", { anonymousId: "anon-z" });
  await trackClientEvent(db, "welcome_viewed", { anonymousId: "anon-z" });
  await trackClientEvent(db, "companion_chosen", { userId: user.id });

  assert.equal(
    (await countEventsForAnonymous(db, "anon-z", "welcome_viewed"))?.n,
    2,
  );
  assert.equal(
    (await countEventsForUser(db, user.id, "companion_chosen"))?.n,
    1,
  );
});
