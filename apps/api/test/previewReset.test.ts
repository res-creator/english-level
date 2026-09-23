import test from "node:test";
import assert from "node:assert/strict";
import type { DatabaseSync } from "node:sqlite";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import { resetPreviewAccount } from "../src/services/previewResetService.ts";
import { isPreviewEnvironment } from "../src/previewMode.ts";
import { acceptInvite, createInvite } from "../src/services/friendService.ts";
import { selectCompanion } from "../src/services/spaceService.ts";
import { getToday } from "../src/services/todayService.ts";
import { getMyEnglish } from "../src/services/myEnglishService.ts";
import { getCourse } from "../src/services/curriculumService.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";
import type { Db } from "../src/db/types.ts";

const EPISODE_1 = "les_sie_a1_e1";
const EPISODE_2 = "les_sie_a1_e2";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

function envWith(environment?: string) {
  return { ENVIRONMENT: environment };
}

/** Every table the reset claims to clear, counted for one user. */
function stateOf(sqlite: DatabaseSync, userId: string) {
  const one = (sql: string, params: unknown[]) =>
    (sqlite.prepare(sql).get(...(params as never[])) as { n: number }).n;
  return {
    learningSessions: one(
      "SELECT COUNT(*) n FROM learning_sessions WHERE user_id = ?",
      [userId],
    ),
    exerciseAttempts: one(
      "SELECT COUNT(*) n FROM exercise_attempts WHERE user_id = ?",
      [userId],
    ),
    reviewSessions: one(
      "SELECT COUNT(*) n FROM review_sessions WHERE user_id = ?",
      [userId],
    ),
    itemMemory: one(
      "SELECT COUNT(*) n FROM user_item_memory WHERE user_id = ?",
      [userId],
    ),
    capabilities: one(
      "SELECT COUNT(*) n FROM user_capabilities WHERE user_id = ?",
      [userId],
    ),
    lessonProgress: one(
      "SELECT COUNT(*) n FROM user_lesson_progress WHERE user_id = ?",
      [userId],
    ),
    placementAttempts: one(
      "SELECT COUNT(*) n FROM placement_attempts WHERE user_id = ?",
      [userId],
    ),
    placementAnswers: one(
      `SELECT COUNT(*) n FROM placement_answers
       WHERE attempt_id IN (SELECT id FROM placement_attempts WHERE user_id = ?)`,
      [userId],
    ),
    rewards: one("SELECT COUNT(*) n FROM user_rewards WHERE user_id = ?", [
      userId,
    ]),
    companion: one("SELECT COUNT(*) n FROM user_companion WHERE user_id = ?", [
      userId,
    ]),
    friendships: one(
      "SELECT COUNT(*) n FROM friendships WHERE user_id = ? OR friend_user_id = ?",
      [userId, userId],
    ),
    friendInvites: one(
      "SELECT COUNT(*) n FROM friend_invites WHERE inviter_user_id = ? OR accepted_by_user_id = ?",
      [userId, userId],
    ),
  };
}

/** Drives a user into a thoroughly "used" account: capability earned,
 * rewards unlocked, memory scheduled, companion chosen, friend linked. */
async function makeUsedAccount(
  db: Db,
  sqlite: DatabaseSync,
  telegramId: number,
) {
  const user = await makeVerifiedUser(db, telegramId, "A1");
  await selectCompanion(db, user.id, "cmp_fox");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_2);
  givePlacementHistory(sqlite, user.id, telegramId);
  return user;
}

/** A finished placement attempt with one answer, so the reset's placement
 * clearing is exercised against real rows rather than an empty table. */
function givePlacementHistory(
  sqlite: DatabaseSync,
  userId: string,
  seed: number,
) {
  const attemptId = `pla_test_${seed}`;
  const question = sqlite
    .prepare("SELECT id FROM placement_questions LIMIT 1")
    .get() as { id: string };
  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT INTO placement_attempts
         (id, user_id, test_version, status, started_at, completed_at, result_level)
       VALUES (?, ?, 'v1', 'completed', ?, ?, 'A1')`,
    )
    .run(attemptId, userId, now, now);
  sqlite
    .prepare(
      `INSERT INTO placement_answers (id, attempt_id, question_id, answer, is_correct)
       VALUES (?, ?, ?, 'x', 1)`,
    )
    .run(`pans_test_${seed}`, attemptId, question.id);
}

// --- the environment guard -------------------------------------------------

test("preview tools exist only in the preview environment", () => {
  assert.equal(isPreviewEnvironment(envWith("preview")), true);
});

test("the guard fails closed — production, dev and an unset value are all 'not preview'", () => {
  assert.equal(isPreviewEnvironment(envWith("production")), false);
  assert.equal(isPreviewEnvironment(envWith("development")), false);
  assert.equal(isPreviewEnvironment(envWith(undefined)), false);
  assert.equal(isPreviewEnvironment(envWith("Preview")), false);
  assert.equal(isPreviewEnvironment(envWith("")), false);
});

// --- what the reset clears -------------------------------------------------

test("a used account really has state to lose before the reset", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 601);

  const before = stateOf(sqlite, user.id);
  assert.ok(before.learningSessions > 0);
  assert.ok(before.exerciseAttempts > 0);
  assert.ok(before.itemMemory > 0);
  assert.ok(before.capabilities > 0);
  assert.ok(before.lessonProgress > 0);
  assert.ok(before.rewards > 0);
  assert.equal(before.companion, 1);
  assert.ok(before.placementAttempts > 0);
  assert.ok(before.placementAnswers > 0);
});

test("the reset clears every piece of learning state it claims to", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 602);

  await resetPreviewAccount(db, user.id);

  const after = stateOf(sqlite, user.id);
  assert.deepEqual(after, {
    learningSessions: 0,
    exerciseAttempts: 0,
    reviewSessions: 0,
    itemMemory: 0,
    capabilities: 0,
    lessonProgress: 0,
    placementAttempts: 0,
    placementAnswers: 0,
    rewards: 0,
    companion: 0,
    friendships: 0,
    friendInvites: 0,
  });
});

test("onboarding, level and return state go back to a brand-new account", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 603);
  sqlite
    .prepare("UPDATE users SET last_active_at = ? WHERE id = ?")
    .run(new Date().toISOString(), user.id);

  await resetPreviewAccount(db, user.id);

  const row = sqlite
    .prepare(
      `SELECT onboarding_completed, onboarding_stage, current_cefr_level,
              self_reported_cefr_level, last_active_at
       FROM users WHERE id = ?`,
    )
    .get(user.id) as {
    onboarding_completed: number;
    onboarding_stage: string;
    current_cefr_level: string | null;
    self_reported_cefr_level: string | null;
    last_active_at: string | null;
  };
  assert.equal(row.onboarding_completed, 0);
  assert.equal(row.onboarding_stage, "goals");
  assert.equal(row.current_cefr_level, null);
  assert.equal(row.self_reported_cefr_level, null);
  assert.equal(row.last_active_at, null);
});

test("onboarding preferences go back to defaults rather than staying pre-filled", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 604);
  sqlite
    .prepare(
      "UPDATE user_settings SET daily_minutes = 15, learning_goals_json = ? WHERE user_id = ?",
    )
    .run('["travel","work"]', user.id);

  await resetPreviewAccount(db, user.id);

  const settings = sqlite
    .prepare(
      "SELECT daily_minutes, learning_goals_json FROM user_settings WHERE user_id = ?",
    )
    .get(user.id) as { daily_minutes: number; learning_goals_json: string };
  assert.equal(settings.daily_minutes, 10);
  assert.equal(settings.learning_goals_json, "[]");
});

test("the account itself survives — the reset is not a delete", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 605);
  const before = sqlite
    .prepare("SELECT telegram_user_id, first_name FROM users WHERE id = ?")
    .get(user.id);

  await resetPreviewAccount(db, user.id);

  const after = sqlite
    .prepare("SELECT telegram_user_id, first_name FROM users WHERE id = ?")
    .get(user.id);
  assert.deepEqual(after, before);
});

test("the signed-in session is left alone, so the reset does not log anyone out", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 606);
  sqlite
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
       VALUES ('ses_test', ?, 'hash', ?, ?)`,
    )
    .run(user.id, new Date().toISOString(), new Date().toISOString());

  await resetPreviewAccount(db, user.id);

  const sessions = sqlite
    .prepare("SELECT COUNT(*) n FROM sessions WHERE user_id = ?")
    .get(user.id) as { n: number };
  assert.equal(sessions.n, 1);
});

// --- scope and safety ------------------------------------------------------

test("another account is never touched by someone else's reset", async () => {
  const { db, sqlite } = await seeded();
  const mine = await makeUsedAccount(db, sqlite, 607);
  const theirs = await makeUsedAccount(db, sqlite, 608);

  const theirsBefore = stateOf(sqlite, theirs.id);
  await resetPreviewAccount(db, mine.id);

  assert.deepEqual(stateOf(sqlite, theirs.id), theirsBefore);
  const theirUser = sqlite
    .prepare(
      "SELECT onboarding_completed, current_cefr_level FROM users WHERE id = ?",
    )
    .get(theirs.id) as {
    onboarding_completed: number;
    current_cefr_level: string | null;
  };
  assert.equal(theirUser.onboarding_completed, 1);
  assert.equal(theirUser.current_cefr_level, "A1");
});

test("a friendship is cleared from both sides, never left dangling", async () => {
  const { db, sqlite } = await seeded();
  const a = await makeVerifiedUser(db, 609, "A1");
  const b = await makeVerifiedUser(db, 610, "A1");
  const invite = await createInvite(db, a.id);
  assert.equal(invite.ok, true);
  if (!invite.ok) return;
  await acceptInvite(db, b.id, invite.code);

  await resetPreviewAccount(db, a.id);

  const rows = sqlite.prepare(
    "SELECT COUNT(*) n FROM friendships",
  ) as unknown as {
    get(): { n: number };
  };
  assert.equal(
    rows.get().n,
    0,
    "the other side must not keep a half friendship",
  );
  assert.equal(stateOf(sqlite, b.id).friendInvites, 0);
});

test("shared content is never deleted — only the user's own state", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 611);
  const contentBefore = sqlite
    .prepare(
      `SELECT (SELECT COUNT(*) FROM modules) m, (SELECT COUNT(*) FROM lessons) l,
              (SELECT COUNT(*) FROM learning_items) i, (SELECT COUNT(*) FROM lesson_items) li,
              (SELECT COUNT(*) FROM placement_questions) q`,
    )
    .get();

  await resetPreviewAccount(db, user.id);

  const contentAfter = sqlite
    .prepare(
      `SELECT (SELECT COUNT(*) FROM modules) m, (SELECT COUNT(*) FROM lessons) l,
              (SELECT COUNT(*) FROM learning_items) i, (SELECT COUNT(*) FROM lesson_items) li,
              (SELECT COUNT(*) FROM placement_questions) q`,
    )
    .get();
  assert.deepEqual(contentAfter, contentBefore);
});

test("resetting twice is safe and honestly reports nothing left to clear", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 612);

  const first = await resetPreviewAccount(db, user.id);
  assert.ok(first.learningSessions > 0);

  const second = await resetPreviewAccount(db, user.id);
  assert.deepEqual(second, {
    learningSessions: 0,
    exerciseAttempts: 0,
    reviewSessions: 0,
    itemMemory: 0,
    capabilities: 0,
    lessonProgress: 0,
    placementAttempts: 0,
    rewards: 0,
    companion: 0,
    friendships: 0,
    friendInvites: 0,
  });
});

// --- what the app looks like afterwards ------------------------------------

test("after a reset the app behaves like a brand-new account", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 613);

  await resetPreviewAccount(db, user.id);

  // No verified level: exactly the state a freshly-created account is in.
  const today = await getToday(db, user.id, null);
  assert.equal(today.action, "none");
  assert.equal(today.episode, null);
  assert.equal(today.reviewDue, 0);
  assert.equal(today.companionId, null);
  assert.deepEqual(today.capabilities, { canDo: 0, consolidated: 0 });

  const english = await getMyEnglish(db, user.id, null);
  assert.deepEqual(english.capabilities, []);
  assert.deepEqual(english.phrases, []);
  assert.equal(english.stats.phrasesMet, 0);

  const course = await getCourse(db, null, user.id);
  assert.deepEqual(course.chapters, []);
});

test("the course starts over from the first situation once a level is set again", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeUsedAccount(db, sqlite, 614);
  await resetPreviewAccount(db, user.id);

  // Re-placing the account at A1 is what onboarding would do.
  sqlite
    .prepare("UPDATE users SET current_cefr_level = 'A1' WHERE id = ?")
    .run(user.id);

  const course = await getCourse(db, "A1", user.id);
  assert.equal(course.episodesDone, 0);
  assert.equal(course.currentEpisodeId, EPISODE_1);
  for (const episode of course.chapters[0]?.episodes ?? []) {
    assert.equal(episode.state, null);
    assert.equal(episode.sessionsDone, 0);
  }
});
