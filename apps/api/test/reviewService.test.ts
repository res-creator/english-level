import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { seedContent } from "../src/content/seedContent.ts";
import {
  MAX_REVIEW_ITEMS,
  answerReviewActivity,
  getReviewSession,
  getReviewState,
  startReviewSession,
} from "../src/services/reviewService.ts";
import {
  driveEpisodeToCanDo,
  driveLessonToCompletion,
  makeVerifiedUser,
} from "./helpers/lessonFixtures.ts";
import type { Db } from "../src/db/types.ts";
import type { DatabaseSync } from "node:sqlite";
import type { ActivityDTO } from "@english-level/contracts";

const EPISODE_1 = "les_sie_a1_e1";

async function seeded() {
  const { db, sqlite } = createTestDb();
  await seedContent(db);
  return { db, sqlite };
}

/** Everything the learner has met falls due. */
function makeEverythingDue(sqlite: DatabaseSync, daysAgo = 1) {
  sqlite
    .prepare("UPDATE user_item_memory SET due_at = ?")
    .run(new Date(Date.now() - daysAgo * 86_400_000).toISOString());
}

function storedAnswer(
  sqlite: DatabaseSync,
  sessionId: string,
  activity: ActivityDTO,
): string {
  const row = sqlite
    .prepare("SELECT activities_json FROM review_sessions WHERE id = ?")
    .get(sessionId) as { activities_json: string };
  const stored = (
    JSON.parse(row.activities_json) as {
      id: string;
      kind: string;
      correctOptionId?: string;
      acceptedAnswers?: string[];
      correctAnswer?: string;
    }[]
  ).find((a) => a.id === activity.id);
  if (!stored) throw new Error(`activity ${activity.id} missing`);
  switch (stored.kind) {
    case "multiple_choice":
    case "fill_gap_choice":
      return stored.correctOptionId!;
    case "typed_recall":
      return stored.acceptedAnswers![0]!;
    case "sentence_build":
      return stored.correctAnswer!;
    default:
      return "ack";
  }
}

async function driveReview(
  db: Db,
  sqlite: DatabaseSync,
  userId: string,
  opts: { correct: boolean } = { correct: true },
) {
  const started = await startReviewSession(db, userId);
  if (!started.ok)
    throw new Error(`review start failed: ${JSON.stringify(started.error)}`);
  const sessionId = started.session.sessionId;
  let current = started.session.currentActivity;
  let i = 0;
  while (current) {
    const res = await answerReviewActivity(db, userId, sessionId, {
      activityId: current.id,
      answer: opts.correct
        ? storedAnswer(sqlite, sessionId, current)
        : "definitely wrong",
      attemptId: `rev-${i++}`,
    });
    if (!res.ok) throw new Error(`review answer failed`);
    if (res.session.status === "completed") return res.session.result;
    current = res.session.nextActivity;
  }
  throw new Error("review session never completed");
}

// --- nothing is due --------------------------------------------------------

test("a learner who has met no language has nothing to review", async () => {
  const { db } = await seeded();
  const user = await makeVerifiedUser(db, 401, "A1");
  const state = await getReviewState(db, user.id);
  assert.equal(state.due, 0);
  assert.equal(state.estimatedMinutes, 0);
  assert.equal(state.availableForExtra, false);

  const started = await startReviewSession(db, user.id);
  assert.equal(started.ok, false);
  if (!started.ok) assert.equal(started.error.code, "nothing_due");
});

test("language met today is not due today — the first review is tomorrow", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 402, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);

  const met = sqlite
    .prepare("SELECT COUNT(*) n FROM user_item_memory WHERE user_id = ?")
    .get(user.id) as { n: number };
  assert.ok(met.n > 0, "the session's language must enter memory");

  const state = await getReviewState(db, user.id);
  assert.equal(state.due, 0);
  assert.equal(state.availableForExtra, true);
});

// --- the queue -------------------------------------------------------------

test("the review queue is finite — it never becomes a wall of debt", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 403, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  await driveEpisodeToCanDo(db, sqlite, user.id, "les_sie_a1_e2");
  await driveEpisodeToCanDo(db, sqlite, user.id, "les_sie_a1_e3");
  makeEverythingDue(sqlite, 40);

  const state = await getReviewState(db, user.id);
  assert.ok(
    state.due <= MAX_REVIEW_ITEMS,
    `queue must be capped, got ${state.due}`,
  );

  const started = await startReviewSession(db, user.id);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  assert.ok(started.session.total <= MAX_REVIEW_ITEMS);
});

test("starting review twice resumes the same session instead of making a second one", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 404, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  makeEverythingDue(sqlite);

  const first = await startReviewSession(db, user.id);
  const second = await startReviewSession(db, user.id);
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.session.sessionId, second.session.sessionId);

  const count = sqlite
    .prepare("SELECT COUNT(*) n FROM review_sessions WHERE user_id = ?")
    .get(user.id) as { n: number };
  assert.equal(count.n, 1);
});

test("a review session survives closing and reopening the app", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 405, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  makeEverythingDue(sqlite);

  const started = await startReviewSession(db, user.id);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const reopened = await getReviewSession(
    db,
    user.id,
    started.session.sessionId,
  );
  assert.equal(reopened.ok, true);
  if (!reopened.ok) return;
  assert.equal(
    reopened.session.currentActivity?.id,
    started.session.currentActivity?.id,
  );
});

test("another learner cannot open someone else's review session", async () => {
  const { db, sqlite } = await seeded();
  const owner = await makeVerifiedUser(db, 406, "A1");
  const other = await makeVerifiedUser(db, 407, "A1");
  await driveLessonToCompletion(db, sqlite, owner.id, EPISODE_1);
  makeEverythingDue(sqlite);
  const started = await startReviewSession(db, owner.id);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const stolen = await getReviewSession(
    db,
    other.id,
    started.session.sessionId,
  );
  assert.equal(stolen.ok, false);
});

// --- scheduling ------------------------------------------------------------

test("a correct review pushes the item further away; a wrong one brings it back tomorrow", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 408, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  makeEverythingDue(sqlite);

  await driveReview(db, sqlite, user.id, { correct: true });
  const afterCorrect = sqlite
    .prepare(
      "SELECT box, due_at FROM user_item_memory WHERE user_id = ? AND reviews > 0 ORDER BY box DESC LIMIT 1",
    )
    .get(user.id) as { box: number; due_at: string };
  assert.ok(afterCorrect.box >= 2, "a correct answer must move the item up");
  assert.ok(
    new Date(afterCorrect.due_at).getTime() > Date.now() + 86_400_000,
    "box 2+ must not come back tomorrow",
  );

  makeEverythingDue(sqlite);
  await driveReview(db, sqlite, user.id, { correct: false });
  const afterWrong = sqlite
    .prepare(
      "SELECT box, last_result FROM user_item_memory WHERE user_id = ? AND last_result = 'wrong' LIMIT 1",
    )
    .get(user.id) as { box: number; last_result: string } | undefined;
  assert.ok(afterWrong, "a wrong answer must be recorded");
  assert.ok(
    (afterWrong?.box ?? 0) >= 1,
    "a slip never drops an item below the first box",
  );
});

test("review reports an honest accuracy and never invents reviewed items", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 409, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);
  makeEverythingDue(sqlite);

  const started = await startReviewSession(db, user.id);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const total = started.session.total;

  const result = await driveReview(db, sqlite, user.id, { correct: true });
  assert.equal(result.reviewed, total);
  assert.equal(result.correctCount, total);
  assert.equal(result.accuracy, 100);
});

// --- consolidation ---------------------------------------------------------

test("a capability does not become CONSOLIDATED without a real gap in time", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 410, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  makeEverythingDue(sqlite);

  const result = await driveReview(db, sqlite, user.id, { correct: true });
  assert.deepEqual(result.consolidated, []);
  const state = sqlite
    .prepare(
      "SELECT state FROM user_capabilities WHERE user_id = ? AND lesson_id = ?",
    )
    .get(user.id, EPISODE_1) as { state: string };
  assert.equal(state.state, "can_do");
});

test("language that survives a week of spacing becomes CONSOLIDATED and leaves a memory object", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 411, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);

  // The capability was earned ten days ago and its language is due now.
  const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
  sqlite
    .prepare("UPDATE user_capabilities SET can_do_at = ? WHERE user_id = ?")
    .run(tenDaysAgo, user.id);
  makeEverythingDue(sqlite);

  const result = await driveReview(db, sqlite, user.id, { correct: true });
  assert.ok(
    result.consolidated.includes(EPISODE_1),
    `expected ${EPISODE_1} to consolidate, got ${JSON.stringify(result.consolidated)}`,
  );
  const state = sqlite
    .prepare(
      "SELECT state, consolidated_at FROM user_capabilities WHERE user_id = ? AND lesson_id = ?",
    )
    .get(user.id, EPISODE_1) as { state: string; consolidated_at: string };
  assert.equal(state.state, "consolidated");
  assert.ok(state.consolidated_at);
  assert.ok(result.rewards.some((r) => r.id === "rw_plant"));
});

test("a consolidated capability is never demoted by a later slip", async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 412, "A1");
  await driveEpisodeToCanDo(db, sqlite, user.id, EPISODE_1);
  sqlite
    .prepare(
      "UPDATE user_capabilities SET state = 'consolidated', can_do_at = ? WHERE user_id = ?",
    )
    .run(new Date(Date.now() - 10 * 86_400_000).toISOString(), user.id);

  makeEverythingDue(sqlite);
  await driveReview(db, sqlite, user.id, { correct: false });

  const state = sqlite
    .prepare(
      "SELECT state FROM user_capabilities WHERE user_id = ? AND lesson_id = ?",
    )
    .get(user.id, EPISODE_1) as { state: string };
  assert.equal(state.state, "consolidated");
});

// --- extra practice --------------------------------------------------------

test('"хочу ещё" gives practice without pulling scheduled reviews forward', async () => {
  const { db, sqlite } = await seeded();
  const user = await makeVerifiedUser(db, 413, "A1");
  await driveLessonToCompletion(db, sqlite, user.id, EPISODE_1);

  const dueBefore = (await getReviewState(db, user.id)).due;
  assert.equal(dueBefore, 0);

  const extra = await startReviewSession(db, user.id, { extraPractice: true });
  assert.equal(extra.ok, true);
  if (!extra.ok) return;
  assert.ok(extra.session.total > 0);
});
